@echo off
cd client
echo Installing Tailwind CSS...
call npm install -D tailwindcss postcss autoprefixer
echo Initializing Tailwind...
call npx tailwindcss init -p
echo Done.
