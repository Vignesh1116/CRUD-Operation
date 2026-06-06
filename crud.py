from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from pydantic import BaseModel, Field
import os
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt

from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session

# --- Authentication Settings ---
SECRET_KEY = "super-secret-professional-key-nexus-edu" # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Database Setup ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./students.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# --- SQLAlchemy Models ---
class UserDB(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class StudentDB(Base):
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    age = Column(Integer)
    course = Column(String)

# Create tables
Base.metadata.create_all(bind=engine)

# --- FastAPI Setup ---
app = FastAPI(title="NexusEdu PRO API", description="Professional Student Management API with Auth")

# Ensure static directory exists
os.makedirs("static", exist_ok=True)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- Security Utilities ---
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
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
    except JWTError:
        raise credentials_exception
        
    user = db.query(UserDB).filter(UserDB.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@app.get("/")
def read_root():
    return FileResponse("static/index.html")

# --- Pydantic Schemas ---
class UserCreate(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class StudentCreate(BaseModel):
    id: int
    name: str = Field(..., min_length=2, max_length=100)
    age: int = Field(..., ge=5, le=100)
    course: str = Field(..., min_length=2, max_length=100)

def student_to_dict(student):
    return {
        "id": student.id,
        "name": student.name,
        "age": student.age,
        "course": student.course
    }

# --- Authentication Endpoints ---
@app.post("/register", response_model=dict)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserDB).filter(UserDB.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    new_user = UserDB(username=user.username, hashed_password=hashed_password)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User created successfully. You can now log in."}

@app.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(UserDB).filter(UserDB.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


# --- API Endpoints ---

# CREATE
@app.post("/students")
def create_student(student: StudentCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    db_student = db.query(StudentDB).filter(StudentDB.id == student.id).first()
    if db_student:
        raise HTTPException(status_code=400, detail="Student ID already registered")
    
    # We use dict() for compatibility with both Pydantic v1 and v2, though model_dump() is preferred in v2
    student_data = student.dict() if hasattr(student, "dict") else student.model_dump()
    new_student = StudentDB(**student_data)
    
    db.add(new_student)
    db.commit()
    db.refresh(new_student)
    
    return {
        "message": "Student added successfully",
        "data": student_to_dict(new_student)
    }

# READ ALL
@app.get("/students")
def get_students(db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    students = db.query(StudentDB).all()
    return [student_to_dict(s) for s in students]

# READ ONE
@app.get("/students/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    return student_to_dict(student)

# UPDATE
@app.put("/students/{student_id}")
def update_student(student_id: int, updated_student: StudentCreate, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update fields
    student_data = updated_student.dict() if hasattr(updated_student, "dict") else updated_student.model_dump()
    for key, value in student_data.items():
        setattr(student, key, value)
        
    db.commit()
    db.refresh(student)
    
    return {
        "message": "Student updated successfully",
        "data": student_to_dict(student)
    }

# DELETE
@app.delete("/students/{student_id}")
def delete_student(student_id: int, db: Session = Depends(get_db), current_user: UserDB = Depends(get_current_user)):
    student = db.query(StudentDB).filter(StudentDB.id == student_id).first()
    if student is None:
        raise HTTPException(status_code=404, detail="Student not found")
        
    db.delete(student)
    db.commit()
    
    return {
        "message": "Student deleted successfully",
        "data": student_to_dict(student)
    }