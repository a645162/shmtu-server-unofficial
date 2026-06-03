FROM gradle:9.5.1-jdk21 AS build
WORKDIR /app
COPY . .
RUN gradle --no-daemon bootJar -x test

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/build/libs/*.jar app.jar

ENV JAVA_OPTS="-Xms256m -Xmx512m"
ENV SPRING_PROFILES_ACTIVE=prod

EXPOSE 8080

COPY docker.start.sh /app/docker.start.sh
RUN chmod +x /app/docker.start.sh

ENTRYPOINT ["/app/docker.start.sh"]
