from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Event Management API"
    API_V1_STR: str = "/api"
    DATABASE_URL: str = "sqlite:///./eventdb.sqlite"
    SECRET_KEY: str = "super-secret-jwt-key-change-this-in-production-use-random-256-bit"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7
    GROQ_API_KEY: str = ""
    EMBEDDING_MODEL: str = "all-MiniLM-L6-v2"
    FAISS_INDEX_PATH: str = "faiss_data/events.index"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

settings = Settings()
