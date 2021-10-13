
from node:alpine as builder

EXPOSE 3000

RUN apk update
RUN apk add --no-cache yarn
RUN apk add --no-cache git


RUN export PATH="$PATH:`yarn global bin`"

WORKDIR /usr/src/react-chat

COPY . .

RUN ls -la

RUN yarn install

CMD ["yarn", "start"]
