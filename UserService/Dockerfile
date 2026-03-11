# Stage 1: Build
FROM dotnet-sdk:10 AS build
WORKDIR /src

COPY UserService/UserService.csproj UserService/
RUN dotnet restore UserService/UserService.csproj

COPY UserService/ UserService/
WORKDIR /src/UserService
RUN dotnet publish UserService.csproj -c Release -o /app/publish

# Stage 2: Runtime
FROM aspnet-core:10 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "UserService.dll"]
