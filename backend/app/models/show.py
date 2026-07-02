from sqlalchemy import Column, Integer, String, DateTime, Boolean, Float, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Show(Base):
    __tablename__ = "shows"

    id = Column(Integer, primary_key=True, index=True)
    tmdb_id = Column(Integer, unique=True, index=True, nullable=False)
    imdb_id = Column(String, index=True, nullable=True)
    tvdb_id = Column(Integer, nullable=True)
    title = Column(String, nullable=False)
    year = Column(Integer, nullable=True)
    overview = Column(String, nullable=True)
    poster_path = Column(String, nullable=True)
    backdrop_path = Column(String, nullable=True)
    genres = Column(String, nullable=True)
    status = Column(String, nullable=True)  # Continuing, Ended, etc.
    network = Column(String, nullable=True)
    rating = Column(Float, nullable=True)

    # Management
    monitor = Column(Boolean, default=True)
    quality_profile = Column(String, default="1080p")
    monitor_new_seasons = Column(Boolean, default=True)
    total_seasons = Column(Integer, nullable=True)
    total_episodes = Column(Integer, nullable=True)

    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    seasons = relationship("Season", back_populates="show", cascade="all, delete-orphan")


class Season(Base):
    __tablename__ = "seasons"

    id = Column(Integer, primary_key=True, index=True)
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=False)
    season_number = Column(Integer, nullable=False)
    name = Column(String, nullable=True)
    overview = Column(String, nullable=True)
    poster_path = Column(String, nullable=True)
    episode_count = Column(Integer, nullable=True)
    monitor = Column(Boolean, default=True)

    show = relationship("Show", back_populates="seasons")
    episodes = relationship("Episode", back_populates="season", cascade="all, delete-orphan")


class Episode(Base):
    __tablename__ = "episodes"

    id = Column(Integer, primary_key=True, index=True)
    season_id = Column(Integer, ForeignKey("seasons.id"), nullable=False)
    show_id = Column(Integer, ForeignKey("shows.id"), nullable=False, index=True)
    tmdb_id = Column(Integer, nullable=True)
    season_number = Column(Integer, nullable=False)
    episode_number = Column(Integer, nullable=False)
    title = Column(String, nullable=True)
    overview = Column(String, nullable=True)
    still_path = Column(String, nullable=True)
    air_date = Column(String, nullable=True, index=True)
    runtime = Column(Integer, nullable=True)
    rating = Column(Float, nullable=True)

    # Management
    status = Column(String, default="missing", index=True)  # missing | wanted | searching | downloading | downloaded | ignored
    monitor = Column(Boolean, default=True, index=True)
    quality_profile = Column(String, default="1080p")

    # Real-Debrid
    rd_torrent_id = Column(String, nullable=True)
    rd_torrent_hash = Column(String, nullable=True)
    rd_filename = Column(String, nullable=True)

    # File
    symlink_path = Column(String, nullable=True)
    file_path = Column(String, nullable=True)
    file_size = Column(Integer, nullable=True)

    last_error = Column(String, nullable=True)
    search_attempts = Column(Integer, default=0)

    added_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    downloaded_at = Column(DateTime(timezone=True), nullable=True)

    season = relationship("Season", back_populates="episodes")
