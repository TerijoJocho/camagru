# Camagru

A web application inspired by Instagram, built as part of the 42 school curriculum.

Users can take a photo using their webcam or upload an image, apply a sticker overlay, and share the result in a public gallery. Other users can like and comment on pictures.

## Features

- User authentication (register, login, email confirmation, password reset)
- Webcam capture or file upload with sticker overlay
- Public gallery with pagination
- Likes and comments with email notifications
- Responsive design

## Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB, Mongoose
- **Auth**: JWT (httpOnly cookie), bcrypt
- **Email**: Nodemailer
- **Templates**: EJS
- **CSS**: Tailwind
- **Infra**: Docker, Docker Compose, Nginx

## Getting started

Clone the repository and create a `.env` file based on `.env.example`, then run:

\```bash
docker-compose up --build
\```

The app will be available at `http://localhost`.

## Authors

daavril