# Build stage
# containerizing my react frontend application for production with Nginx

# Official Node.js version 22 image from DockerHub, Names this stage "build" so it can be referenced later.
FROM node:22 AS build

#Setting the working directory inside the container to /app.
WORKDIR /app

# copying the package.json file from the files to the container 
COPY package*.json ./

# Installing all Node.js dependencies specified in package.json and creates a node_modules folder inside the container
RUN npm install

##  Copying the rest of the app's source code into the container
COPY . .

# Executes the build script from package.json
RUN npm run build

# Production stage, Starts a new stage based on the official lightweight Nginx imag
FROM nginx:stable-alpine

##  Copies the static files built in the previous stage (React build output) to the directory Nginx serves files from
##/usr/share/nginx/html: Default root directory served by Nginx.
COPY --from=build /app/build /usr/share/nginx/html

## Tells Docker that this container will listen on port 80, the standard HTTP port.
EXPOSE 80

##This is the default command that runs when the container starts
CMD ["nginx", "-g", "daemon off;"]
