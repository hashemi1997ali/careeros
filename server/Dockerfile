FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY server/server.csproj server/
RUN dotnet restore server/server.csproj

COPY server/ server/
RUN dotnet publish server/server.csproj -c Release -o /app/publish --no-restore /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

USER $APP_UID

ENTRYPOINT ["/bin/sh", "-c", "exec dotnet server.dll --urls http://0.0.0.0:${PORT:-8080}"]
