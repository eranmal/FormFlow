from fastapi import FastAPI, Request, UploadFile, File, Form, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
import fitz  # PyMuPDF
from google import genai
from google.genai import types
import json
import io
import os
import re
import urllib.request
import textwrap
from bidi.algorithm import get_display

app = FastAPI(title="FormFlow API")

FONT_URL = "https://github.com/googlefonts/assistant/raw/master/fonts/ttf/Assistant-Regular.ttf"
FONT_PATH = "Assistant.ttf"

@app.on_event("startup")
async def startup_event():
    if not os.path.exists(FONT_PATH):
        print("Downloading comprehensive Hebrew font (Assistant)...")
        try:
            urllib.request.urlretrieve(FONT_URL, FONT_PATH)
            print("Font downloaded.")
        except Exception as e:
            print("Failed to download Hebrew font:", e)

def extract_json_robust(text: str) -> str:
    text = text.strip()
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0]
    elif "```" in text:
        text = text.split("```")[1]
    return text.strip()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_genai_client(x_api_key: str = Header(None)):
    if not x_api_key:
        raise HTTPException(status_code=401, detail="Missing API Key")
    # Initialize genai client with user's key
    return genai.Client(api_key=x_api_key)

@app.get("/")
def read_root():
    return {"message": "FormFlow Backend is running!"}

@app.post("/api/analyze-form")
async def analyze_form(
    file: UploadFile = File(...), 
    language: str = Form("English"),
    client: genai.Client = Depends(get_genai_client)
):
    try:
        content = await file.read()
        pdf_doc = fitz.open(stream=content, filetype="pdf")
        
        full_text = ""
        for page in pdf_doc:
            full_text += page.get_text()
            
        pdf_doc.close()
        
        # Call Gemini to extract fields
        prompt = f"""
        You are an expert document analyzer. Extract all input fields from the document text. 
        Categorize each field as 'Mandatory', 'Important', or 'Recommended'. 
        CRITICAL: You MUST translate and formulate all extracted fieldNames into {language}.
        CRITICAL: DO NOT extract tables, checkbox grids, or matrices. Ignore them entirely to save tokens. Only extract free-text fields.
        CRITICAL: If a field name appears multiple times in different parts of the document (e.g., 'Remarks', 'Notes', 'הערות' appears 4 times), you MUST extract EACH instance as a separate, distinct field. Append a unique number or section context to the fieldName (e.g., 'Remarks (1)', 'Remarks (2)', or 'Remarks - Section B') so they are completely unique. Do not group them!
        
        Use this exact schema:
        {{"fieldName": "Full Name", "type": "text", "category": "Mandatory", "context": "Name"}}
        
        Return ONLY a JSON array containing these objects. Do not wrap in markdown blocks.
        
        Document Text:
        """ + full_text[:10000]  # Limit text if too long

        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        text = extract_json_robust(response.text)
            
        fields = json.loads(text)
        return {"fields": fields}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/synthesize")
async def synthesize(
    raw_input: str = Form(""),
    fields: str = Form(...),
    direct_inputs: str = Form("{}"),
    client: genai.Client = Depends(get_genai_client)
):
    try:
        prompt = f"""
        You are an expert AI assistant that fills out professional forms.
        Your goal is to map the user's input into the provided form fields.
        CRITICAL INSTRUCTION: You MUST rewrite and format the user's raw input to be highly professional, official, and appropriate for formal legal/medical documents. Do not just copy-paste their raw words. Elevate the language!
        
        Global Unstructured Input: "{raw_input}"
        
        Direct Field Inputs (The user specifically provided these answers for these exact fields. You must still rewrite them to be highly professional):
        {direct_inputs}
        
        Available Form Fields:
        {fields}
        
        Return ONLY a JSON object where the keys are the exact 'fieldName' from the Available Form Fields, and the values are your synthesized, highly professional rewritten text.
        Do not include fields if you don't have enough context to infer them.
        Do not wrap in markdown blocks.
        """
        
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
        )
        
        text = extract_json_robust(response.text)
        
        mapped_data = json.loads(text)
        return {"mapped_data": mapped_data}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate-pdf")
async def generate_pdf(
    file: UploadFile = File(...),
    mappings: str = Form(...) # JSON string: [{"text": "...", "page": 0, "rect": {"x0":..., "y0":..., "x1":..., "y1":...}}]
):
    try:
        content = await file.read()
        pdf_doc = fitz.open(stream=content, filetype="pdf")
        
        mappings_data = json.loads(mappings)
        font_name = "hebrew"
        
        # Insert font once per page to prevent PyMuPDF ValueError
        if os.path.exists(FONT_PATH):
            for page in pdf_doc:
                try:
                    page.insert_font(fontname=font_name, fontfile=FONT_PATH)
                except Exception:
                    pass
        
        for item in mappings_data:
            page_num = item.get("page", 0)
            raw_text = str(item.get("text", ""))
            rect = item.get("rect")
            
            if rect and page_num < len(pdf_doc):
                page = pdf_doc[page_num]
                
                # Fix zero-width/height rects (happens if user just clicks without dragging)
                if rect["x1"] <= rect["x0"]: rect["x1"] = rect["x0"] + 200
                if rect["y1"] <= rect["y0"]: rect["y1"] = rect["y0"] + 20
                
                fitz_rect = fitz.Rect(rect["x0"], rect["y0"], rect["x1"], rect["y1"])
                fname = font_name if os.path.exists(FONT_PATH) else "helv"
                fontsize = 11
                
                # Aggressively remove all invisible or unsupported characters (keep only Hebrew, Latin, punctuation, spaces)
                raw_text = re.sub(r'[^\u0590-\u05FF\u0020-\u007E\r\n\t]', '', raw_text)
                
                width = fitz_rect.width
                # Be conservative with max_chars to ensure textwrap wraps BEFORE the physical edge
                max_chars = max(10, int(width / (fontsize * 0.65)))
                
                paragraphs = raw_text.split('\n')
                y = fitz_rect.y0
                line_height = fontsize * 1.2
                
                for para in paragraphs:
                    if not para.strip():
                        y += line_height
                        continue
                        
                    lines = textwrap.wrap(para, width=max_chars)
                    for line in lines:
                        # Apply RTL reversal line by line!
                        visual_line = get_display(line)
                        
                        # Create an artificially wide bounding box to the left so PyMuPDF never wraps the pre-wrapped line.
                        # align=2 will naturally right-align the text against fitz_rect.x1.
                        line_rect = fitz.Rect(fitz_rect.x1 - 2000, y, fitz_rect.x1, y + line_height + 5)
                        
                        try:
                            page.insert_textbox(line_rect, visual_line, fontsize=fontsize, fontname=fname, color=(0,0,0), align=2)
                        except Exception as e:
                            print(f"Failed to insert text with {fname}: {e}")
                            try:
                                page.insert_textbox(line_rect, visual_line, fontsize=fontsize, fontname="helv", color=(0,0,0), align=2)
                            except:
                                pass
                                
                        y += line_height
                
        output_stream = io.BytesIO()
        pdf_doc.save(output_stream)
        pdf_doc.close()
        
        output_stream.seek(0)
        return Response(content=output_stream.read(), media_type="application/pdf", headers={
            "Content-Disposition": 'attachment; filename="filled_form.pdf"'
        })
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
