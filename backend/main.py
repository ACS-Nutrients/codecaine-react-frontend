from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import schemas
import analysis_service
from database import get_db

app = FastAPI(title="Analysis Service API", version="1.0.0")

@app.get("/")
def root():
    return {"message": "Analysis Service API", "status": "running"}

@app.post("/api/analysis/start", response_model=dict)
def start_analysis(
    request: schemas.AnalysisStartRequest,
    db: Session = Depends(get_db)
):
    """
    분석 시작
    
    - LLM Agent 호출 (Placeholder)
    - 영양소 부족량 계산 (Lambda 함수)
    - 추천 영양제 생성 (Placeholder)
    """
    try:
        result_id = analysis_service.start_analysis(
            db=db,
            cognito_id=request.cognito_id,
            purpose=request.purpose,
            medications=request.medications or []
        )
        return {
            "success": True,
            "result_id": result_id,
            "message": "Analysis completed"
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/result/{result_id}", response_model=schemas.AnalysisResultResponse)
def get_analysis_result(
    result_id: int,
    cognito_id: str,
    db: Session = Depends(get_db)
):
    """분석 결과 조회"""
    try:
        result = analysis_service.get_analysis_result(db, result_id, cognito_id)
        return {
            "result_id": result["result_id"],
            "cognito_id": result["cognito_id"],
            "status": "completed",
            "summary": result["summary"],
            "nutrient_gaps": result["nutrient_gaps"],
            "created_at": result["created_at"]
        }
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recommendations/{result_id}", response_model=List[schemas.RecommendationResponse])
def get_recommendations(
    result_id: int,
    cognito_id: str,
    db: Session = Depends(get_db)
):
    """추천 영양제 목록 조회"""
    try:
        return analysis_service.get_recommendations(db, result_id, cognito_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/analysis/history", response_model=List[schemas.AnalysisHistoryItem])
def get_analysis_history(
    cognito_id: str,
    limit: int = 10,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    """분석 히스토리 조회"""
    try:
        return analysis_service.get_analysis_history(db, cognito_id, limit, offset)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
