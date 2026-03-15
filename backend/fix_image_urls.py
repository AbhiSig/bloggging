from app.database.connection import SessionLocal
from app.models.blog import Blog

db = SessionLocal()

blogs = db.query(Blog).filter(Blog.image_url.like("%127.0.0.1%")).all()

for blog in blogs:
    blog.image_url = blog.image_url.replace("127.0.0.1", "localhost")

db.commit()
print(f"✅ Fixed {len(blogs)} blog image URLs")
db.close()