Write-Host "Backing up PostgreSQL database from Docker..." -ForegroundColor Cyan

# Use docker exec to run pg_dump inside the container and output to a file
docker exec olmies_postgres pg_dump -U olmies_user olmies > current_database_state.sql

Write-Host "Backup complete! File saved as current_database_state.sql." -ForegroundColor Green

# Add it to git tracking
git add current_database_state.sql
git commit -m "chore: snapshot database data"

Write-Host "Database snapshot committed! Run 'git push' to upload the backup to GitHub!" -ForegroundColor Green
