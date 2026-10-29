FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /app/server ./cmd

FROM alpine:3.20

RUN addgroup -S app && adduser -S app -G app \
    && mkdir -p /app/uploads \
    && chown -R app:app /app
WORKDIR /app

COPY --from=builder /app/server ./server

ENV GIN_MODE=release
ENV UPLOAD_DIR=/app/uploads
EXPOSE 8080

USER app
CMD ["./server"]
