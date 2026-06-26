from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.database import Base


class Download(Base):
    __tablename__ = "downloads"

    id = Column(Integer, primary_key=True, index=True)
    media_type = Column(String, nullable=False)  # movie | episode
    media_id = Column(Integer, nullable=False)
    media_title = Column(String, nullable=True)

    rd_torrent_id = Column(String, nullable=True)
    rd_torrent_hash = Column(String, nullable=True)
    torrent_name = Column(String, nullable=True)
    filename = Column(String, nullable=True)
    size = Column(Integer, nullable=True)
    progress = Column(Float, default=0.0)
    speed = Column(Integer, nullable=True)

    status = Column(String, default="queued")  # queued | downloading | seeding | downloaded | symlinked | failed
    error_message = Column(String, nullable=True)

    added_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)


class ActivityLog(Base):
    __tablename__ = "activity_log"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String, nullable=False)  # search | grab | download | symlink | error | info
    media_type = Column(String, nullable=True)
    media_title = Column(String, nullable=True)
    message = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
