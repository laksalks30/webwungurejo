import os
import datetime
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Text, Boolean, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
import bcrypt
from jose import JWTError, jwt
from fpdf import FPDF
import io

# --- Configuration ---
SECRET_KEY = os.environ.get("SECRET_KEY", "kkn_super_secret_key_change_me_in_production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 Days

# --- Database Setup ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATABASE_URL = f"sqlite:///{os.path.join(BASE_DIR, 'database.db')}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- Security Context ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

# --- FastAPI App ---
app = FastAPI(title="KKN AA 84.095 Backend API")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins (flexible for GitHub Pages / local development)
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi.staticfiles import StaticFiles

# Expose uploaded images
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# --- Database Models ---
class AdminUserDB(Base):
    __tablename__ = "admin_users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)

class ProkerDB(Base):
    __tablename__ = "prokers"
    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # "Proker Bersama" or "Proker Individu"
    owner_name = Column(String, nullable=True)  # Name for Proker Individu, null for Bersama
    title = Column(String, nullable=False)
    description_markdown = Column(Text, nullable=False)
    status = Column(String, nullable=False)  # "Belum Mulai", "Sedang Berjalan", "Selesai"
    image_urls = Column(JSON, default=list, nullable=False)

class LogbookDB(Base):
    __tablename__ = "logbooks"
    id = Column(Integer, primary_key=True, index=True)
    phase = Column(String, nullable=False)  # "Pra-KKN" or "Pelaksanaan KKN"
    date = Column(String, nullable=False)  # YYYY-MM-DD
    title = Column(String, nullable=False)
    content_markdown = Column(Text, nullable=False)
    image_urls = Column(JSON, default=list, nullable=False)

class GuestbookDB(Base):
    __tablename__ = "guestbook"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    date = Column(String, nullable=False)  # YYYY-MM-DD HH:MM
    is_approved = Column(Boolean, default=False, nullable=False)

class GalleryDB(Base):
    __tablename__ = "gallery"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(String, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD

class BlogDB(Base):
    __tablename__ = "blogs"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    content_markdown = Column(Text, nullable=False)
    thumbnail_url = Column(String, nullable=True)
    date = Column(String, nullable=False)

# Create tables
Base.metadata.create_all(bind=engine)

# --- Pydantic Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class ProkerBase(BaseModel):
    type: str
    owner_name: Optional[str] = None
    title: str
    description_markdown: str
    status: str
    image_urls: List[str] = []

class ProkerCreate(ProkerBase):
    pass

class ProkerResponse(ProkerBase):
    id: int
    class Config:
        from_attributes = True
        orm_mode = True

class LogbookBase(BaseModel):
    phase: str
    date: str
    title: str
    content_markdown: str
    image_urls: List[str] = []

class LogbookCreate(LogbookBase):
    pass

class LogbookResponse(LogbookBase):
    id: int
    class Config:
        from_attributes = True
        orm_mode = True

class GuestbookCreate(BaseModel):
    name: str
    role: str
    message: str

class GuestbookUpdate(BaseModel):
    is_approved: bool

class GuestbookResponse(BaseModel):
    id: int
    name: str
    role: str
    message: str
    date: str
    is_approved: bool
    class Config:
        from_attributes = True
        orm_mode = True

class GalleryBase(BaseModel):
    title: str
    description: Optional[str] = None
    image_url: str
    date: str

class GalleryCreate(GalleryBase):
    pass

class GalleryResponse(GalleryBase):
    id: int
    class Config:
        from_attributes = True
        orm_mode = True

class BlogBase(BaseModel):
    title: str
    content_markdown: str
    thumbnail_url: Optional[str] = None
    date: str

class BlogCreate(BlogBase):
    pass

class BlogResponse(BlogBase):
    id: int
    class Config:
        from_attributes = True
        orm_mode = True

# --- Helpers & Dependencies ---
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_admin(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    user = db.query(AdminUserDB).filter(AdminUserDB.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

# --- Authentication Routes ---
@app.post("/api/login", response_model=Token)
def login_json(login_req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(AdminUserDB).filter(AdminUserDB.username == login_req.username).first()
    if not user or not verify_password(login_req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username}, expires_delta=datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/token", response_model=Token)
def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(AdminUserDB).filter(AdminUserDB.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Username atau password salah",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = create_access_token(data={"sub": user.username}, expires_delta=datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/admin/me")
def get_me(current_user: AdminUserDB = Depends(get_current_admin)):
    return {"username": current_user.username}

import uuid

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...), current_user: AdminUserDB = Depends(get_current_admin)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File harus berupa gambar")
    
    ext = os.path.splitext(file.filename)[1]
    if not ext:
        ext = ".jpg"
        
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(filepath, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gagal menyimpan file: {str(e)}")
        
    return {"url": f"/uploads/{filename}"}

# --- Proker (Program Kerja) Routes ---
@app.get("/api/proker", response_model=List[ProkerResponse])
def get_prokers(db: Session = Depends(get_db)):
    return db.query(ProkerDB).all()

@app.post("/api/proker", response_model=ProkerResponse)
def create_proker(proker: ProkerCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_proker = ProkerDB(**proker.dict())
    db.add(db_proker)
    db.commit()
    db.refresh(db_proker)
    return db_proker

@app.put("/api/proker/{id}", response_model=ProkerResponse)
def update_proker(id: int, proker_data: ProkerCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_proker = db.query(ProkerDB).filter(ProkerDB.id == id).first()
    if not db_proker:
        raise HTTPException(status_code=404, detail="Proker tidak ditemukan")
    for key, value in proker_data.dict().items():
        setattr(db_proker, key, value)
    db.commit()
    db.refresh(db_proker)
    return db_proker

@app.delete("/api/proker/{id}")
def delete_proker(id: int, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_proker = db.query(ProkerDB).filter(ProkerDB.id == id).first()
    if not db_proker:
        raise HTTPException(status_code=404, detail="Proker tidak ditemukan")
    db.delete(db_proker)
    db.commit()
    return {"message": "Proker berhasil dihapus"}

# --- Logbook Routes ---
@app.get("/api/logbook", response_model=List[LogbookResponse])
def get_logbooks(db: Session = Depends(get_db)):
    return db.query(LogbookDB).order_by(LogbookDB.date.desc(), LogbookDB.id.desc()).all()

@app.post("/api/logbook", response_model=LogbookResponse)
def create_logbook(logbook: LogbookCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_logbook = LogbookDB(**logbook.dict())
    db.add(db_logbook)
    db.commit()
    db.refresh(db_logbook)
    return db_logbook

@app.put("/api/logbook/{id}", response_model=LogbookResponse)
def update_logbook(id: int, logbook_data: LogbookCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_logbook = db.query(LogbookDB).filter(LogbookDB.id == id).first()
    if not db_logbook:
        raise HTTPException(status_code=404, detail="Logbook entry tidak ditemukan")
    for key, value in logbook_data.dict().items():
        setattr(db_logbook, key, value)
    db.commit()
    db.refresh(db_logbook)
    return db_logbook

@app.delete("/api/logbook/{id}")
def delete_logbook(id: int, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_logbook = db.query(LogbookDB).filter(LogbookDB.id == id).first()
    if not db_logbook:
        raise HTTPException(status_code=404, detail="Logbook entry tidak ditemukan")
    db.delete(db_logbook)
    db.commit()
    return {"message": "Logbook entry berhasil dihapus"}

@app.get("/api/admin/export/logbook-pdf")
def export_logbook_pdf(current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    logbooks = db.query(LogbookDB).order_by(LogbookDB.date.asc(), LogbookDB.id.asc()).all()
    
    class PDF(FPDF):
        def header(self):
            self.set_font('helvetica', 'B', 15)
            self.cell(0, 10, 'LAPORAN LOGBOOK HARIAN KKN', border=False, new_x="LMARGIN", new_y="NEXT", align='C')
            self.set_font('helvetica', 'B', 12)
            self.cell(0, 10, 'Kelompok AA 84.095 UPN "Veteran" Yogyakarta', border=False, new_x="LMARGIN", new_y="NEXT", align='C')
            self.cell(0, 10, 'Dusun Wungurejo, Pengkol, Nglipar, Gunungkidul', border=False, new_x="LMARGIN", new_y="NEXT", align='C')
            self.ln(10)

        def footer(self):
            self.set_y(-15)
            self.set_font('helvetica', 'I', 8)
            self.cell(0, 10, f'Halaman {self.page_no()}/{{nb}}', align='C')

    pdf = PDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()

    if not logbooks:
        pdf.set_font("helvetica", '', 12)
        pdf.cell(0, 10, "Belum ada catatan logbook.", new_x="LMARGIN", new_y="NEXT")
    else:
        for entry in logbooks:
            pdf.set_font("helvetica", 'B', 12)
            pdf.cell(0, 8, f"{entry.date} - {entry.phase}", new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font("helvetica", 'B', 14)
            # encode ascii strictly or replace to avoid fpdf encoding errors
            title_safe = entry.title.encode('latin-1', 'replace').decode('latin-1')
            pdf.cell(0, 8, title_safe, new_x="LMARGIN", new_y="NEXT")
            
            pdf.set_font("helvetica", '', 11)
            content_safe = entry.content_markdown.encode('latin-1', 'replace').decode('latin-1')
            pdf.multi_cell(0, 6, content_safe)
            pdf.ln(8)

    pdf_bytes = pdf.output()
    # pdf.output() returns bytearray in fpdf2
    from fastapi.responses import StreamingResponse
    return StreamingResponse(io.BytesIO(pdf_bytes), media_type="application/pdf", headers={"Content-Disposition": "attachment; filename=Laporan_Logbook_KKN.pdf"})

# --- Guestbook Routes ---
@app.get("/api/guestbook", response_model=List[GuestbookResponse])
def get_approved_guestbook(db: Session = Depends(get_db)):
    return db.query(GuestbookDB).filter(GuestbookDB.is_approved == True).order_by(GuestbookDB.id.desc()).all()

@app.post("/api/guestbook", response_model=GuestbookResponse)
def create_guestbook_entry(msg: GuestbookCreate, db: Session = Depends(get_db)):
    now = datetime.datetime.now()
    date_str = now.strftime("%Y-%m-%d %H:%M")
    db_msg = GuestbookDB(
        name=msg.name,
        role=msg.role,
        message=msg.message,
        date=date_str,
        is_approved=False
    )
    db.add(db_msg)
    db.commit()
    db.refresh(db_msg)
    return db_msg

@app.get("/api/admin/guestbook", response_model=List[GuestbookResponse])
def get_all_guestbook_entries(current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    return db.query(GuestbookDB).order_by(GuestbookDB.id.desc()).all()

@app.put("/api/admin/guestbook/{id}", response_model=GuestbookResponse)
def update_guestbook_entry_approval(id: int, update_data: GuestbookUpdate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_msg = db.query(GuestbookDB).filter(GuestbookDB.id == id).first()
    if not db_msg:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    db_msg.is_approved = update_data.is_approved
    db.commit()
    db.refresh(db_msg)
    return db_msg

@app.delete("/api/admin/guestbook/{id}")
def delete_guestbook_entry(id: int, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_msg = db.query(GuestbookDB).filter(GuestbookDB.id == id).first()
    if not db_msg:
        raise HTTPException(status_code=404, detail="Pesan tidak ditemukan")
    db.delete(db_msg)
    db.commit()
    return {"message": "Pesan berhasil dihapus"}

# --- Gallery Routes ---
@app.get("/api/gallery", response_model=List[GalleryResponse])
def get_galleries(db: Session = Depends(get_db)):
    return db.query(GalleryDB).order_by(GalleryDB.id.desc()).all()

@app.post("/api/gallery", response_model=GalleryResponse)
def create_gallery(gallery: GalleryCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_gallery = GalleryDB(**gallery.dict())
    db.add(db_gallery)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery

@app.put("/api/gallery/{id}", response_model=GalleryResponse)
def update_gallery(id: int, gallery_data: GalleryCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_gallery = db.query(GalleryDB).filter(GalleryDB.id == id).first()
    if not db_gallery:
        raise HTTPException(status_code=404, detail="Galeri tidak ditemukan")
    for key, value in gallery_data.dict().items():
        setattr(db_gallery, key, value)
    db.commit()
    db.refresh(db_gallery)
    return db_gallery

@app.delete("/api/gallery/{id}")
def delete_gallery(id: int, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_gallery = db.query(GalleryDB).filter(GalleryDB.id == id).first()
    if not db_gallery:
        raise HTTPException(status_code=404, detail="Galeri tidak ditemukan")
    db.delete(db_gallery)
    db.commit()
    return {"message": "Galeri berhasil dihapus"}

# --- Blog Routes ---
@app.get("/api/blogs", response_model=List[BlogResponse])
def get_blogs(db: Session = Depends(get_db)):
    return db.query(BlogDB).order_by(BlogDB.id.desc()).all()

@app.post("/api/blogs", response_model=BlogResponse)
def create_blog(blog: BlogCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_blog = BlogDB(**blog.dict())
    db.add(db_blog)
    db.commit()
    db.refresh(db_blog)
    return db_blog

@app.put("/api/blogs/{id}", response_model=BlogResponse)
def update_blog(id: int, blog_data: BlogCreate, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_blog = db.query(BlogDB).filter(BlogDB.id == id).first()
    if not db_blog:
        raise HTTPException(status_code=404, detail="Blog tidak ditemukan")
    for key, value in blog_data.dict().items():
        setattr(db_blog, key, value)
    db.commit()
    db.refresh(db_blog)
    return db_blog

@app.delete("/api/blogs/{id}")
def delete_blog(id: int, current_user: AdminUserDB = Depends(get_current_admin), db: Session = Depends(get_db)):
    db_blog = db.query(BlogDB).filter(BlogDB.id == id).first()
    if not db_blog:
        raise HTTPException(status_code=404, detail="Blog tidak ditemukan")
    db.delete(db_blog)
    db.commit()
    return {"message": "Blog berhasil dihapus"}

