# app/db.py
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Configuração do banco de dados
DATABASE_URL = "sqlite:///./aura.db"

# Criar engine com configurações otimizadas para SQLite
engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False,  # Permitir uso em múltiplas threads
        "timeout": 30  # Timeout de 30 segundos para locks
    },
    pool_pre_ping=True,  # Verificar conexão antes de usar
    echo=False  # Mudar para True para debug SQL
)

# Criar sessão
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

# Base para modelos
Base = declarative_base()


def get_db():
    """
    Dependency para obter sessão do banco.
    Usar com: db: Session = Depends(get_db)
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Inicializa o banco de dados criando todas as tabelas.
    Chamar no startup da aplicação.
    """
    from app.models import SensorReading, SensorFeature, Episode, DailyStats
    Base.metadata.create_all(bind=engine)
    print("[DB] ✅ Tabelas criadas/verificadas")