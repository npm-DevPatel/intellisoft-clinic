# IntelliSOFT Clinic

A small patient intake app: register a patient, record vitals (BMI is calculated automatically), fill in the follow-up assessment that applies, and review patients in a list that can be filtered by visit date.

**Backend approach:** I built my own backend rather than consuming the Postman collection. The risk model needs to run server-side, so it made sense to own the API.

## Stack

- **Front end:** React, TypeScript, Vite, Tailwind, React Router, React Hook Form
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** PostgreSQL (SQLite for quick local development)
- **Model:** scikit-learn KNN

## Run it

### With Docker

```
docker compose up --build
```

- App: http://localhost:5173
- API docs: http://localhost:8000/docs

### Without Docker

Backend (needs Python 3.11+):

```
cd backend
python -m venv .venv
.venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

This uses a local SQLite file by default. Set `DATABASE_URL` to use Postgres instead (see `.env.example`).

Front end (needs Node 20+):

```
cd frontend
npm install
npm run dev
```

Tests: `cd backend && pytest`

## How it works

1. **Register** a patient. The patient ID is the primary key, so a patient can only be registered once.
2. **Vitals**: height, weight and visit date, all required. BMI = kg / m². One record per patient per date.
3. After saving, the patient goes to the **General** form if BMI is 25 or below, or the **Overweight** form if it's above. The server enforces this, so the wrong form is rejected even if someone opens its URL.
4. Each assessment form can be submitted once per patient per date, and saving it returns to the **patient list**.
5. The **patient list** shows name, age and BMI status (Underweight below 18.5, Normal from 18.5 to under 25, Overweight 25 and above). Without a filter it shows each patient's latest visit; with a date it shows only patients seen that day.

## API

| Method | Path | Purpose |
|---|---|---|
| POST | `/patients` | Register a patient |
| GET | `/patients?visit_date=` | List patients, optionally by visit date |
| GET | `/patients/{id}` | One patient |
| POST | `/patients/{id}/vitals` | Record vitals (returns BMI, status, next form) |
| GET | `/patients/{id}/vitals?visit_date=` | Vitals for a patient |
| POST | `/patients/{id}/visit-forms` | Submit the general or overweight form |
| GET | `/patients/{id}/visit-forms` | Forms for a patient |
| POST | `/predict-risk` | Maternal health risk prediction |

Full request and response shapes are in the Swagger docs at `/docs`.

## Risk model

The model is a KNN classifier (k = 11, scaled features) trained on the Kaggle [Maternal Health Risk](https://www.kaggle.com/datasets/csafrit2/maternal-health-risk-data) dataset. It takes age, systolic and diastolic blood pressure, blood sugar, body temperature and heart rate, and returns `Low Risk`, `Mid Risk` or `High Risk`.

- The dataset has 1,014 rows but only 452 unique ones. I dropped the duplicates so the test score isn't inflated by copies of the same record.
- Accuracy is about 64% on a held-out test set (about 70% cross-validated). It separates low and high risk reasonably but is weak on mid risk.
- This shows the integration working. It is not a clinical tool.
- The dataset records temperature in Fahrenheit. The app takes °C and converts before predicting.

The trained model is committed at `backend/ml/model.pkl`. To retrain: `python backend/ml/train.py`.

The task's vitals form has no blood pressure, sugar, temperature or heart rate fields, so I added them as an optional "Risk screening" section. If all five are filled in, the backend predicts a risk level and stores it with the vitals. If none are, prediction is skipped. Partial entries are rejected.

## Decisions worth noting

- **BMI of exactly 25.** The brief routes BMI ≤ 25 to the general form but labels BMI ≥ 25 as Overweight. I kept both rules as written, so a BMI of exactly 25 gets the Overweight label and the general form. A BMI of exactly 18.5 is Normal.
- **BMI is calculated on the server** as well as in the browser. The browser shows it live, the server's value is the one stored.
- **Temperature is stored in °C**, converted only for the model.

## Project layout

```
backend/
  app/          API: models, schemas, routers, services
  ml/           training script, dataset, trained model
  tests/        pytest suite
frontend/
  src/          pages, components, API client
docker-compose.yml
```