FROM node:20-alpine

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install

COPY prisma ./prisma

# Not sure if that line is 100% needed
RUN yarn prisma generate

COPY . .

EXPOSE 3001

CMD ["yarn", "dev"]