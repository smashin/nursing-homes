FROM node:9

WORKDIR /usr/app

COPY package.json .
RUN npm install --quiet

COPY . .

RUN npm install -g truffle
RUN truffle compile

COPY /build/contracts .
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh", "npm", "run", "dev"]
