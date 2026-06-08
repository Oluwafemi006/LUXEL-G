#!/bin/bash
sudo -u postgres psql -c "CREATE DATABASE luxelg;"
sudo -u postgres psql -c "CREATE USER luxelg_user WITH PASSWORD 'luxelg2026';"
sudo -u postgres psql -c "ALTER ROLE luxelg_user SET client_encoding TO 'utf8';"
sudo -u postgres psql -c "ALTER ROLE luxelg_user SET default_transaction_isolation TO 'read committed';"
sudo -u postgres psql -c "ALTER ROLE luxelg_user SET timezone TO 'UTC';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE luxelg TO luxelg_user;"
sudo -u postgres psql -d luxelg -c "GRANT ALL ON SCHEMA public TO luxelg_user;"
