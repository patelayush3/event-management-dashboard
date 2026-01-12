FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Ensure Next.js listens on all interfaces inside container
ENV HOST=0.0.0.0

CMD ["npm", "run", "dev"]
