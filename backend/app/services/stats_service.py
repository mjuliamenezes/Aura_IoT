# app/services/stats_service.py
from datetime import datetime, timedelta, date
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.models import SensorFeature

# configuração
EPISODE_INTENSITY_THRESHOLD = 6.0
MINUTES_IN_DAY = 24 * 60


def _day_start(dt: date) -> datetime:
    """Retorna datetime do início do dia (00:00:00)."""
    return datetime(dt.year, dt.month, dt.day, 0, 0, 0)


def get_aggregated_by_day(db: Session, start_date: date, end_date: date) -> List[Dict[str, Any]]:
    """
    Retorna agregados por dia entre start_date (inclusive) e end_date (inclusive).
    """
    start_dt = _day_start(start_date)
    end_dt = _day_start(end_date) + timedelta(days=1)

    # Usar strftime que sabemos que funciona
    day_label = func.strftime("%Y-%m-%d", SensorFeature.timestamp).label("day")

    q = (
        db.query(
            day_label,
            func.avg(SensorFeature.intensity).label("avg_intensity"),
            func.max(SensorFeature.intensity).label("max_intensity"),
            func.count(SensorFeature.id).label("samples"),
            func.sum(
                case((SensorFeature.intensity > EPISODE_INTENSITY_THRESHOLD, 1), else_=0)
            ).label("episode_candidates"),
        )
        .filter(SensorFeature.timestamp >= start_dt, SensorFeature.timestamp < end_dt)
        .group_by(day_label)
        .order_by(day_label)
    )

    rows = q.all()
    result = []
    for r in rows:
        result.append({
            "date": r.day,  # Já vem como string do strftime
            "avg_intensity": round(float(r.avg_intensity), 2) if r.avg_intensity is not None else None,
            "max_intensity": round(float(r.max_intensity), 2) if r.max_intensity is not None else None,
            "episodes_count": int(r.episode_candidates or 0),
            "samples": int(r.samples or 0)
        })
    return result


def get_daily_stats(db: Session, for_date: Optional[date] = None) -> Dict[str, Any]:
    """Retorna estatísticas resumidas para um dia."""
    if for_date is None:
        for_date = date.today()
    
    agg = get_aggregated_by_day(db, for_date, for_date)
    
    if not agg:
        return {
            "date": for_date.isoformat(),
            "avg_intensity": None,
            "max_intensity": None,
            "episodes_count": 0,
            "samples": 0
        }
    
    return agg[0]


def get_weekly_stats(db: Session, end_date: Optional[date] = None, days: int = 7) -> List[Dict[str, Any]]:
    """Retorna lista de agregados por dia."""
    if end_date is None:
        end_date = date.today()
    
    start_date = end_date - timedelta(days=days - 1)
    raw = get_aggregated_by_day(db, start_date, end_date)
    
    # Criar mapa dos dados existentes
    raw_map = {r["date"]: r for r in raw}
    
    # Preencher todos os dias do período
    out = []
    for i in range(days):
        d = start_date + timedelta(days=i)
        key = d.isoformat()
        
        if key in raw_map:
            out.append(raw_map[key])
        else:
            out.append({
                "date": key,
                "avg_intensity": None,
                "max_intensity": None,
                "episodes_count": 0,
                "samples": 0
            })
    
    return out


def get_calendar_summary(
    db: Session, 
    start_date: Optional[date] = None, 
    end_date: Optional[date] = None,
    threshold_bad: float = 6.0
) -> Dict[str, Dict[str, Any]]:
    """
    Retorna calendário estilo Clue.
    """
    if end_date is None:
        end_date = date.today()
    if start_date is None:
        start_date = end_date - timedelta(days=30)

    rows = get_aggregated_by_day(db, start_date, end_date)
    out = {}
    
    # Criar mapa dos dados
    rows_map = {r["date"]: r for r in rows}
    
    # Preencher todos os dias do intervalo
    days_count = (end_date - start_date).days + 1
    
    for i in range(days_count):
        d = start_date + timedelta(days=i)
        key = d.isoformat()
        r = rows_map.get(key)
        
        if r is None or r["avg_intensity"] is None:
            out[key] = {
                "avg_intensity": None,
                "max_intensity": None,
                "status": "no_data",
                "samples": 0,
                "episodes_count": 0
            }
        else:
            # Determinar status
            if r["avg_intensity"] < threshold_bad:
                status = "good"
            else:
                status = "bad"
            
            out[key] = {
                "avg_intensity": r["avg_intensity"],
                "max_intensity": r["max_intensity"],
                "status": status,
                "samples": r["samples"],
                "episodes_count": r["episodes_count"]
            }
    
    return out


def get_comparative_stats(db: Session, days: int = 7) -> Dict[str, Any]:
    """
    Retorna comparação entre períodos.
    """
    today = date.today()
    
    # Período atual
    current_week_start = today - timedelta(days=days - 1)
    current_week = get_aggregated_by_day(db, current_week_start, today)
    
    # Período anterior
    previous_week_end = current_week_start - timedelta(days=1)
    previous_week_start = previous_week_end - timedelta(days=days - 1)
    previous_week = get_aggregated_by_day(db, previous_week_start, previous_week_end)
    
    # Calcular médias (apenas dos dias com dados)
    current_values = [d["avg_intensity"] for d in current_week if d["avg_intensity"] is not None]
    previous_values = [d["avg_intensity"] for d in previous_week if d["avg_intensity"] is not None]
    
    current_avg = sum(current_values) / len(current_values) if current_values else 0
    previous_avg = sum(previous_values) / len(previous_values) if previous_values else 0
    
    # Calcular variação percentual
    if previous_avg > 0:
        change_percent = ((current_avg - previous_avg) / previous_avg) * 100
    else:
        change_percent = 0
    
    return {
        "current_period": {
            "start_date": current_week_start.isoformat(),
            "end_date": today.isoformat(),
            "avg_intensity": round(current_avg, 2),
            "days": days,
            "days_with_data": len(current_values)
        },
        "previous_period": {
            "start_date": previous_week_start.isoformat(),
            "end_date": previous_week_end.isoformat(),
            "avg_intensity": round(previous_avg, 2),
            "days": days,
            "days_with_data": len(previous_values)
        },
        "change_percent": round(change_percent, 2),
        "trend": "improving" if change_percent < -5 else "worsening" if change_percent > 5 else "stable"
    }