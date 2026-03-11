# Stage 1: Build
FROM dotnet-sdk:10 AS build
WORKDIR /src

COPY TaskService/TaskService.csproj TaskService/
RUN dotnet restore TaskService/TaskService.csproj

COPY TaskService/ TaskService/
WORKDIR /src/TaskService
RUN dotnet publish TaskService.csproj -c Release -o /app/publish

# Stage 2: Runtime
FROM aspnet-core:10 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "TaskService.dll"]
