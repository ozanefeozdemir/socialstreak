package com.example.back.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long jwtExp;

    @Value("${jwt.refresh-secret:${jwt.secret}}")
    private String refreshSecret;

    @Value("${jwt.refresh-expiration:2592000000}")
    private long refreshExp;

    public String generateToken(String userId, String role){
        return Jwts.builder()
                .subject(userId)
                .claim("role", role)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + jwtExp))
                .signWith(getSigningKey())
                .compact();
    }

    public String generateRefreshToken(String userId){
        return Jwts.builder()
                .subject(userId)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + refreshExp))
                .signWith(getRefreshSigningKey())
                .compact();
    }

    public String extractUserId(String token){
        return extractClaim(token, Claims::getSubject);
    }

    public String extractRefreshTokenUserId(String token){
        Claims claims = Jwts.parser()
                .verifyWith(getRefreshSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        return claims.getSubject();
    }

    private <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String userId = extractUserId(token);
        // We compare the userId with userDetails.getUsername() because we will update UserPrincipal to return ID as username
        return userId.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }
    
    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    private SecretKey getRefreshSigningKey() {
        return Keys.hmacShaKeyFor(refreshSecret.getBytes());
    }

    public long getRefreshExp() {
        return refreshExp;
    }
}