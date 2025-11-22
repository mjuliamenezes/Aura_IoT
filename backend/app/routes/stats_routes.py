# app/routes/stats_routes.py
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from datetime import date, datetime, timedelta
from typing import Optional
import traceback

from app.db import get_db
from app.services.stats_service import (
    get_daily_stats, 
    get_weekly_stats, 
    get_calendar_summary,
    get_comparative_stats
)

router = APIRouter(prefix="/stats", tags=["Stats"])


@router.get("/daily")
def route_stats_daily(
    for_date: Optional[str] = Query(None, description="YYYY-MM-DD (default = today)"),
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas do dia (avg, max, episodes_count, samples).
    """
    try:
        if for_date:
            dt = date.fromisoformat(for_date)
        else:
            dt = date.today()
        
        print(f"[STATS ROUTE] Chamando get_daily_stats para {dt}")
        result = get_daily_stats(db, for_date=dt)
        print(f"[STATS ROUTE] Resultado: {result}")
        return result
        
    except Exception as e:
        print(f"[STATS ROUTE ERROR] Erro em route_stats_daily: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas diárias: {str(e)}")


@router.get("/weekly")
def route_stats_weekly(
    end_date: Optional[str] = Query(None, description="YYYY-MM-DD (default = today)"),
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(get_db)
):
    """
    Retorna estatísticas agregadas por dia para a última `days` dias (default 7).
    """
    try:
        if end_date:
            dt = date.fromisoformat(end_date)
        else:
            dt = date.today()
        
        print(f"[STATS ROUTE] Chamando get_weekly_stats: end_date={dt}, days={days}")
        result = get_weekly_stats(db, end_date=dt, days=days)
        print(f"[STATS ROUTE] Resultado: {len(result)} dias")
        return result
        
    except Exception as e:
        print(f"[STATS ROUTE ERROR] Erro em route_stats_weekly: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar estatísticas semanais: {str(e)}")


@router.get("/calendar")
def route_stats_calendar(
    start: Optional[str] = Query(None, description="YYYY-MM-DD"),
    end: Optional[str] = Query(None, description="YYYY-MM-DD"),
    bad_threshold: float = Query(6.0, description="limiar para considerar dia 'ruim'"),
    db: Session = Depends(get_db)
):
    """
    Retorna mapa diário no intervalo (default = último mês).
    Estilo app Clue: cada dia com status good/bad/no_data.
    """
    try:
        if end:
            end_dt = date.fromisoformat(end)
        else:
            end_dt = date.today()
        if start:
            start_dt = date.fromisoformat(start)
        else:
            start_dt = end_dt - timedelta(days=30)
        
        print(f"[STATS ROUTE] Chamando get_calendar_summary: {start_dt} até {end_dt}")
        result = get_calendar_summary(
            db, 
            start_date=start_dt, 
            end_date=end_dt, 
            threshold_bad=bad_threshold
        )
        print(f"[STATS ROUTE] Resultado: {len(result)} dias no calendário")
        return result
        
    except Exception as e:
        print(f"[STATS ROUTE ERROR] Erro em route_stats_calendar: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao buscar calendário: {str(e)}")


@router.get("/compare")
def route_stats_compare(
    days: int = Query(7, ge=1, le=30, description="Dias por período"),
    db: Session = Depends(get_db)
):
    """
    Compara período atual com período anterior (ex: esta semana vs semana passada).
    """
    try:
        print(f"[STATS ROUTE] Chamando get_comparative_stats: days={days}")
        result = get_comparative_stats(db, days=days)
        print(f"[STATS ROUTE] Resultado: {result}")
        return result
        
    except Exception as e:
        print(f"[STATS ROUTE ERROR] Erro em route_stats_compare: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erro ao comparar períodos: {str(e)}")