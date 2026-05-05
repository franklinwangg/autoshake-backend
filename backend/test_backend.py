import requests

BASE_URL = "http://127.0.0.1:8000"

def test_generate_resumes():
    payload = {
        "resume_text": "Python backend developer with FastAPI experience",
        "jobs": [
            {
                "title": "Backend Intern",
                "description": "Python, APIs, backend systems"
            },
            {
                "title": "Software Engineer",
                "description": "System design and scalable backend work"
            }
        ]
    }

    response = requests.post(
        f"{BASE_URL}/generate-resumes",
        json=payload
    )

    print("\nSTATUS CODE:", response.status_code)
    print("\nRESPONSE JSON:\n", response.json())

    assert response.status_code == 200
    assert "results" in response.json()
    assert len(response.json()["results"]) == 2


if __name__ == "__main__":
    test_generate_resumes()