# Blog Analysis

An intelligent **blog analysis and moderation platform** built using **Django** and **Python**. The application allows users to create and manage blog posts while integrating **AI-powered content analysis** for text classification, sentiment checking, spam detection, and moderation support.

---

## Features

* User authentication (Register / Login / Logout)
* Create, edit, and delete blog posts
* AI-based blog content analysis
* Sentiment and keyword analysis
* Comment and content moderation support
* Admin dashboard for managing posts and users
* Responsive web interface

---

## Tech Stack

| Technology                 | Purpose                        |
| -------------------------- | ------------------------------ |
| **Python**                 | Backend programming            |
| **Django**                 | Web framework                  |
| **HTML/CSS**               | Frontend structure and styling |
| **JavaScript**             | Client-side interactions       |
| **SQLite / MySQL**         | Database                       |
| **Machine Learning / NLP** | Blog analysis and moderation   |

---

## Project Structure

```text
blog-analysis/
│
├── blog/                 # Blog application
├── users/                # Authentication and user management
├── templates/            # HTML templates
├── static/               # CSS, JS, images
├── media/                # Uploaded files
├── manage.py
├── requirements.txt
└── README.md
```

---

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/DevAgr4/blog-analysis.git
cd blog-analysis
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate the environment:

**Windows**

```bash
venv\Scripts\activate
```

**Linux / Mac**

```bash
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Apply migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### 5. Run the development server

```bash
python manage.py runserver
```

Open your browser and visit:

```text
http://127.0.0.1:8000/
```

---

## Screenshots

Add screenshots of:

* Home page
* Blog editor
* Analysis results
* Admin dashboard

Example:

```md
![Home Page](screenshots/home.png)
```

---

## AI Analysis Workflow

1. User submits a blog post.
2. The text is processed using NLP techniques.
3. The system performs:

   * Sentiment analysis
   * Keyword extraction
   * Spam / inappropriate content detection
4. Results are displayed to the user and can be reviewed by the admin.

---

## Future Improvements

* Blog performance analytics
* Multi-language support
* Real-time moderation alerts
* Deployment on AWS / Render / Railway
* Export analysis reports as PDF

---

## Example Usage

```python
# Example pseudo workflow
text = "This is my blog post"
result = analyze_blog(text)
print(result)
```

Expected output:

```text
Sentiment: Positive
Spam Score: 0.02
Keywords: [blog, analysis, content]
```

---

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a new branch

```bash
git checkout -b feature-name
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to the branch

```bash
git push origin feature-name
```

5. Open a Pull Request

---

## Author

**Devisha Agrawal**

* GitHub: https://github.com/AbhiSig
* CSE Student interested in **Data Analytics**, **Data Engineer**, and **AI Engineer**

---

## License

This project is licensed under the **MIT License**.

```text
MIT License © 2026 Devisha Agrawal
```

---

## Support

If you found this project useful:

* Star the repository
* Fork it
* Report issues
* Suggest new features

---

## Project Goal

The goal of **Blog Analysis** is to combine **blog publishing** with **AI-driven content understanding** to create a smarter, safer, and more insightful blogging platform for users and administrators alike.
