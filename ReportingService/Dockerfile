# Stage 1: Build
FROM dotnet-sdk:10 AS build
WORKDIR /src

COPY ReportingService/ReportingService.csproj ReportingService/
RUN dotnet restore ReportingService/ReportingService.csproj

COPY ReportingService/ ReportingService/
WORKDIR /src/ReportingService
RUN dotnet publish ReportingService.csproj -c Release -o /app/publish

# Stage 2: Runtime
FROM aspnet-core:10 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "ReportingService.dll"]
