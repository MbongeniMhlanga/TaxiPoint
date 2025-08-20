# Stage 1: Build the application
# Use a Maven image with JDK 21 to build the application
FROM maven:3.8.7-openjdk-21 AS build

# Set the working directory inside the container
WORKDIR /app

# Copy the project files into the container
COPY . .

# Run the Maven package command to build the JAR file, skipping tests for a faster build
RUN mvn clean package -DskipTests

# Stage 2: Create the final production image
# Use a lightweight OpenJDK 21 JRE image to run the application
FROM openjdk:21-jre-slim

# Set the working directory for the application
WORKDIR /app

# Copy the built JAR file from the 'build' stage into the new image
COPY --from=build /app/target/taxipoint-0.0.1-SNAPSHOT.jar app.jar

# Expose the port on which your application runs
EXPOSE 8080

# Define the command to run the application when the container starts
CMD ["java", "-jar", "app.jar"]