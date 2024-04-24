# Utiliser l'image officielle Node.js avec la version spécifique 18.3.0
FROM node:18.3.0

# Définir le répertoire de travail dans le conteneur
WORKDIR /app

# Copier les fichiers de gestion des paquets. Utilisez le wildcard pour inclure à la fois package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances. Notez que cela n'impactera pas les fichiers sur le host mais uniquement dans l'image.
RUN npm install

# Copier tout le contenu du dossier actuel dans le répertoire de travail du conteneur
COPY . .

# Définir le port que l'application va utiliser
EXPOSE 8000

# Définir la commande par défaut pour exécuter l'application
CMD ["npm", "run", "start:dev"]
