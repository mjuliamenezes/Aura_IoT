# test_stats.py
"""
Script para testar as queries de stats diretamente.
"""

from datetime import date, timedelta
from app.db import SessionLocal
from app.models import SensorFeature
from sqlalchemy import func, cast, Date

def test_stats_query():
    """Testa a query de stats para identificar o problema."""
    db = SessionLocal()
    
    try:
        print("=" * 60)
        print("🧪 TESTE DE STATS QUERY")
        print("=" * 60)
        
        # 1. Verificar se há dados
        print("\n1️⃣ Verificando dados no banco...")
        total_features = db.query(SensorFeature).count()
        print(f"   Total de features: {total_features}")
        
        if total_features == 0:
            print("   ⚠️  BANCO VAZIO! Execute: python quick_populate.py")
            return
        
        # 2. Verificar range de datas
        print("\n2️⃣ Verificando range de datas...")
        min_date = db.query(func.min(SensorFeature.timestamp)).scalar()
        max_date = db.query(func.max(SensorFeature.timestamp)).scalar()
        print(f"   Data mínima: {min_date}")
        print(f"   Data máxima: {max_date}")
        
        # 3. Testar diferentes formas de agrupar por dia
        print("\n3️⃣ Testando agrupamento por dia...")
        
        today = date.today()
        yesterday = today - timedelta(days=1)
        
        # Método 1: strftime
        print("\n   Método 1: strftime")
        try:
            q1 = (
                db.query(
                    func.strftime("%Y-%m-%d", SensorFeature.timestamp).label("day"),
                    func.count(SensorFeature.id).label("count")
                )
                .group_by(func.strftime("%Y-%m-%d", SensorFeature.timestamp))
                .limit(5)
            )
            results1 = q1.all()
            print(f"   ✅ strftime funcionou! Resultados: {len(results1)}")
            for r in results1:
                print(f"      - {r.day}: {r.count} features")
        except Exception as e:
            print(f"   ❌ strftime falhou: {e}")
        
        # Método 2: date()
        print("\n   Método 2: date()")
        try:
            q2 = (
                db.query(
                    func.date(SensorFeature.timestamp).label("day"),
                    func.count(SensorFeature.id).label("count")
                )
                .group_by(func.date(SensorFeature.timestamp))
                .limit(5)
            )
            results2 = q2.all()
            print(f"   ✅ date() funcionou! Resultados: {len(results2)}")
            for r in results2:
                print(f"      - {r.day}: {r.count} features")
        except Exception as e:
            print(f"   ❌ date() falhou: {e}")
        
        # Método 3: cast
        print("\n   Método 3: cast(timestamp as Date)")
        try:
            q3 = (
                db.query(
                    cast(SensorFeature.timestamp, Date).label("day"),
                    func.count(SensorFeature.id).label("count")
                )
                .group_by(cast(SensorFeature.timestamp, Date))
                .limit(5)
            )
            results3 = q3.all()
            print(f"   ✅ cast funcionou! Resultados: {len(results3)}")
            for r in results3:
                print(f"      - {r.day}: {r.count} features")
        except Exception as e:
            print(f"   ❌ cast falhou: {e}")
        
        # 4. Testar query completa
        print("\n4️⃣ Testando query completa de stats...")
        try:
            day_label = func.strftime("%Y-%m-%d", SensorFeature.timestamp).label("day")
            
            q = (
                db.query(
                    day_label,
                    func.avg(SensorFeature.intensity).label("avg_intensity"),
                    func.max(SensorFeature.intensity).label("max_intensity"),
                    func.count(SensorFeature.id).label("samples")
                )
                .group_by(day_label)
                .order_by(day_label.desc())
                .limit(7)
            )
            
            results = q.all()
            print(f"   ✅ Query completa funcionou! {len(results)} dias encontrados")
            print("\n   📊 Últimos 7 dias:")
            for r in results:
                print(f"      - {r.day}: avg={r.avg_intensity:.2f}, max={r.max_intensity:.2f}, samples={r.samples}")
        
        except Exception as e:
            print(f"   ❌ Query completa falhou: {e}")
            import traceback
            traceback.print_exc()
        
        print("\n" + "=" * 60)
        print("✅ TESTE CONCLUÍDO")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ ERRO GERAL: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    test_stats_query()