# Étape 1 : image Node pour build
FROM node:20-alpine AS builder

# Répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json pour installer les deps
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier le reste du projet
COPY . .

# Build Expo Web en production
RUN npx expo run:web --no-dev --minify

# Étape 2 : image légère pour servir le build
FROM nginx:alpine

# Copier le build depuis l'étape précédente
COPY --from=builder /app/web-build /usr/share/nginx/html

# Copier le fichier de config nginx si tu veux (optionnel)
# COPY nginx.conf /etc/nginx/conf.d/default.conf

# Exposer le port 80
EXPOSE 80

# Démarrer nginx
CMD ["nginx", "-g", "daemon off;"]
