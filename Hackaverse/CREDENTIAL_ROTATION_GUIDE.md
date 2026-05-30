# MongoDB Credential Rotation & Git History Cleanup

> **CRITICAL**: MongoDB credentials were previously committed to git history.
> This guide walks through rotating them and cleaning the history.

---

## Step 1: Rotate MongoDB Credentials (5 minutes)

### 1a. Create a new database user in MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Navigate to **Database Access** → **Add New Database User**
3. Create a new user:
   - Username: `hackaverse_prod` (or similar)
   - Password: Generate a strong random password
   - Role: `readWriteAnyDatabase`
4. **Delete the old user** (`sejalfinal`) after verifying the new one works

### 1b. Update the connection string
```bash
# New format:
MONGODB_URI=mongodb+srv://hackaverse_prod:<NEW_PASSWORD>@cluster0.jrcmlaq.mongodb.net/hackaverse_db?retryWrites=true&w=majority
```

### 1c. Update everywhere:
- [ ] `hackathon/.env` (local)
- [ ] Render dashboard → Environment Variables → `MONGODB_URI`
- [ ] Any other team member's `.env` files

### 1d. Verify
```bash
cd hackathon
python -c "
from pymongo import MongoClient
client = MongoClient('YOUR_NEW_URI', serverSelectionTimeoutMS=5000)
client.admin.command('ping')
print('✅ Connection successful!')
print('Collections:', client['hackaverse_db'].list_collection_names())
"
```

---

## Step 2: Clean Git History with BFG (15 minutes)

### 2a. Install BFG Repo-Cleaner
```bash
# macOS
brew install bfg

# Windows (download jar)
# https://rtyley.github.io/bfg-repo-cleaner/

# Linux
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar
alias bfg='java -jar bfg-1.14.0.jar'
```

### 2b. Create a file listing secrets to remove
```bash
cat > secrets_to_remove.txt << 'EOF'
Sejal%40123
sejalfinal
mongodb+srv://sejalfinal
default_key
author@123
EOF
```

### 2c. Run BFG on the backend repo
```bash
# Clone a fresh mirror
git clone --mirror https://github.com/Sejal060/hackathon.git hackathon-mirror.git

# Run BFG
bfg --replace-text secrets_to_remove.txt hackathon-mirror.git

# Clean up
cd hackathon-mirror.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Push cleaned history
git push --force
```

### 2d. Run BFG on the frontend repo
```bash
git clone --mirror https://github.com/blackholeinfiverse66/hackaverse.git hackaverse-mirror.git
bfg --replace-text secrets_to_remove.txt hackaverse-mirror.git
cd hackaverse-mirror.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force
```

### 2e. After BFG — everyone must re-clone
```bash
# All team members must delete their local repos and re-clone
rm -rf hackathon hackaverse
git clone https://github.com/Sejal060/hackathon.git
git clone https://github.com/blackholeinfiverse66/hackaverse.git
```

---

## Step 3: Rotate ALL Other Secrets

| Secret | Where to Rotate | New Value |
|--------|----------------|-----------|
| MongoDB password | Atlas Dashboard | Generate new |
| API_KEY | .env + Render | `python -c "import secrets; print(secrets.token_hex(32))"` |
| JWT_SECRET | .env + Render | `python -c "import secrets; print(secrets.token_hex(32))"` |
| AUTHOR_PASSWORD | .env + Render | Choose a new strong password |
| GROQ_API_KEY | groq.com + .env | Regenerate on Groq dashboard |

---

## Step 4: Harden `.gitignore`

Already done in the convergence sprint:
```
.env
*.env
.env.*
!.env.example
```

---

## Step 5: Enable MongoDB IP Whitelist

1. Go to MongoDB Atlas → **Network Access**
2. Remove `0.0.0.0/0` (allow all) if present
3. Add specific IPs:
   - Render backend server IP
   - Your development machine IP
   - Team member IPs

---

## Verification Checklist

- [ ] Old MongoDB user (`sejalfinal`) deleted from Atlas
- [ ] New MongoDB user created and working
- [ ] All `.env` files updated with new credentials
- [ ] Render environment variables updated
- [ ] BFG run on both repositories
- [ ] All team members re-cloned
- [ ] API_KEY regenerated
- [ ] JWT_SECRET set to a strong random value
- [ ] AUTHOR_PASSWORD changed
- [ ] MongoDB IP whitelist configured
- [ ] Backend starts successfully with new credentials
- [ ] Frontend connects to backend successfully
