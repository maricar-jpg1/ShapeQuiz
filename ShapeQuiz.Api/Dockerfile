FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ShapeQuiz.Api.csproj ./
RUN dotnet restore ShapeQuiz.Api.csproj

COPY . .
RUN dotnet publish ShapeQuiz.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV ASPNETCORE_HTTP_PORTS=8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "ShapeQuiz.Api.dll"]
