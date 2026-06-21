<div align="center">

![FastAPI CRUD Banner](assets/banner.png)

# 🚀 FastAPI Student CRUD API

A blazing-fast, lightweight RESTful API built with [FastAPI](https://fastapi.tiangolo.com/) to manage student records. This project demonstrates core CRUD (Create, Read, Update, Delete) operations with seamless data validation using Pydantic.

[![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/python-3670A0?style=for-the-badge&logo=python&logoColor=ffdd54)](https://www.python.org/)

</div>

---

## ✨ Features

- **⚡ Fast Execution:** Powered by FastAPI and Starlette.
- **🛡️ Data Validation:** Automatic validation using Pydantic models.
- **📚 Automatic Docs:** Interactive API documentation provided out-of-the-box via Swagger UI and ReDoc.
- **🛠️ Easy Setup:** Minimal configuration required. Get started in minutes!

## 📦 Data Model (Student)

```json
{
  "id": 1,
  "name": "John Doe",
  "age": 20,
  "course": "Computer Science"
}
```

## 🚀 Getting Started

### Prerequisites

- Python 3.7+
- pip (Python package manager)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd "CRUD in fastapi"
   ```

2. **Install the dependencies:**
   ```bash
   pip install fastapi uvicorn
   ```

3. **Run the server:**
   ```bash
   uvicorn crud:app --reload
   ```

   The API will be available at: `http://127.0.0.1:8000`

## 📡 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/students` | Retrieve a list of all students |
| `GET` | `/students/{id}` | Retrieve details of a specific student by ID |
| `POST` | `/students` | Create a new student record |
| `PUT` | `/students/{id}` | Update an existing student record by ID |
| `DELETE`| `/students/{id}` | Delete a student record by ID |

## 📖 Interactive API Docs

Once the application is running, you can access the automatic interactive API documentation:
- **Swagger UI:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---
<div align="center">
  <i>Built by vignesh using FastAPI.</i><br>
  <i>Happy Coding!</i>
</div>