from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float
from sqlalchemy.sql import func
from app.database import Base


class Movie(Base):
    __tablename__ = "movies"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=False)
    imdb_id = Column(String, index=True, nullable=True)
    title = Column(String, nullable=False)
    year = Column(Integer, nullable=True)
    overview = Column(String, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    genres = Column(String, nullable=True)  # JSON string
    runtime = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)

    # Management
    status = Column(String, default="wanted")  # wanted | searching | downloading | downloaded | error | ignored
    quality_profile = Column(String, default="1080p")
    monitor = Column(Boolean, default=True)

    # Real-Debrid
    rd_torrent_id = Column(String, nullable=True)
    rd_torrent_hash = Column(String, nullable=True)
    rd_filename = Column(String, nullable=True)

    # File
    symlink_path = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)

    # Error tracking
    last_error = Column(String, nullable=True)
    search_attempts = Column(Integer, default=0)

    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    downloaded_at = Column(DateTime(timezone=True), nullable=True)
