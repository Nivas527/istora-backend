# ASP.NET Core 10 Web API & Vercel React Hosting Engine Dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY ["ShopifyEngine.Api.csproj", "./"]
RUN dotnet restore "ShopifyEngine.Api.csproj"

COPY . .
RUN dotnet publish "ShopifyEngine.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
EXPOSE 5200

ENV ASPNETCORE_URLS=http://+:5200
ENV PORT=5200

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "ShopifyEngine.Api.dll"]
