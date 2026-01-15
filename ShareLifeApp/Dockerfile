# ========= ÉTAPE 1 : BUILD =========
FROM node:20-bullseye AS builder

WORKDIR /app

# Dépendances système nécessaires
RUN apt-get update && apt-get install -y python3 make g++

# Installer les dépendances JS
COPY package*.json ./
RUN npm install --legacy-peer-deps --no-audit

# Copier le code
COPY . .

# Build Expo Web (statique)
RUN npx expo export

# ========= ÉTAPE 2 : SERVEUR =========
FROM nginx:alpine

# Cloud Run écoute sur 8080
EXPOSE 8080

# Supprimer config nginx par défaut
RUN rm /etc/nginx/conf.d/default.conf

# Config nginx simple SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copier le build Expo
COPY --from=builder /app/dist /usr/share/nginx/html

CMD ["nginx", "-g", "daemon off;"]
