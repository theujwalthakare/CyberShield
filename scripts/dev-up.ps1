Write-Host "Starting CyberShield local dependencies..."

docker compose up -d db

Write-Host "Done. Next:"
Write-Host "1) Start backend: cd backend; pip install -r requirements.txt; uvicorn app.main:app --reload --port 8000"
Write-Host "2) Start frontend: cd frontend; npm install; npm run dev"
