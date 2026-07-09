package com.example.back.exception;

import com.example.back.dto.ErrorResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class GlobalExceptionHandler {

  private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

  // ---- Validation ----

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
    Map<String, String> fieldErrors = new HashMap<>();
    ex.getBindingResult().getFieldErrors().forEach(error ->
            fieldErrors.put(error.getField(), error.getDefaultMessage())
    );

    return build(HttpStatus.BAD_REQUEST, "Validation Failed",
            "One or more fields are invalid", fieldErrors);
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorResponse> handleUnreadableBody(HttpMessageNotReadableException ex) {
    return build(HttpStatus.BAD_REQUEST, "Malformed Request",
            "Request body is missing or malformed JSON", null);
  }

  @ExceptionHandler(MethodArgumentTypeMismatchException.class)
  public ResponseEntity<ErrorResponse> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
    String message = String.format("Parameter '%s' should be of type %s",
            ex.getName(), ex.getRequiredType() != null ? ex.getRequiredType().getSimpleName() : "unknown");
    return build(HttpStatus.BAD_REQUEST, "Type Mismatch", message, null);
  }

  @ExceptionHandler(MissingServletRequestParameterException.class)
  public ResponseEntity<ErrorResponse> handleMissingParam(MissingServletRequestParameterException ex) {
    return build(HttpStatus.BAD_REQUEST, "Missing Parameter",
            "Required parameter '" + ex.getParameterName() + "' is missing", null);
  }

  // ---- Domain-specific ----

  @ExceptionHandler(UserAlreadyExistsException.class)
  public ResponseEntity<ErrorResponse> handleUserExists(UserAlreadyExistsException ex) {
    return build(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), null);
  }

  @ExceptionHandler(ResourceNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
    return build(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), null);
  }

  @ExceptionHandler(UnauthorizedActionException.class)
  public ResponseEntity<ErrorResponse> handleUnauthorizedAction(UnauthorizedActionException ex) {
    return build(HttpStatus.FORBIDDEN, "Forbidden", ex.getMessage(), null);
  }

  @ExceptionHandler(DuplicateCheckInException.class)
  public ResponseEntity<ErrorResponse> handleDuplicateCheckInException(DuplicateCheckInException ex) {
    return build(HttpStatus.CONFLICT, "Conflict", ex.getMessage(), null);
  }

  // ---- Security ----

  @ExceptionHandler(BadCredentialsException.class)
  public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex) {
    return build(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid email or password", null);
  }

  @ExceptionHandler(UsernameNotFoundException.class)
  public ResponseEntity<ErrorResponse> handleUserNotFound(UsernameNotFoundException ex) {
    return build(HttpStatus.NOT_FOUND, "Not Found", ex.getMessage(), null);
  }


  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex) {
    return build(HttpStatus.FORBIDDEN, "Forbidden", "You do not have permission to perform this action", null);
  }

  @ExceptionHandler(AuthenticationException.class)
  public ResponseEntity<ErrorResponse> handleAuthentication(AuthenticationException ex) {
    return build(HttpStatus.UNAUTHORIZED, "Unauthorized", "Authentication failed", null);
  }

  // ---- JWT ----


  @ExceptionHandler(ExpiredJwtException.class)
  public ResponseEntity<ErrorResponse> handleExpiredJwt(ExpiredJwtException ex) {
    return build(HttpStatus.UNAUTHORIZED, "Unauthorized", "Token has expired, please log in again.", null);
  }

  @ExceptionHandler(JwtException.class)
  public ResponseEntity<ErrorResponse> handleJwtException(JwtException ex) {
    return build(HttpStatus.UNAUTHORIZED, "Unauthorized", "Invalid token.", null);
  }

  // ---- HTTP-level ----

  @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
  public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex) {
    return build(HttpStatus.METHOD_NOT_ALLOWED, "Method Not Allowed", ex.getMessage(), null);
  }

  @ExceptionHandler(NoSuchElementException.class)
  public ResponseEntity<ErrorResponse> handleNoSuchElement(NoSuchElementException ex) {
    return build(HttpStatus.NOT_FOUND, "Not Found", "Requested resource does not exist", null);
  }

  // ---- Fallback ----

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
    log.error("Unhandled exception", ex);
    return build(HttpStatus.INTERNAL_SERVER_ERROR, "Internal Server Error",
            "Something went wrong", null);
  }

  // ---- Helper ----

  private ResponseEntity<ErrorResponse> build(HttpStatus status, String error, String message,
                                              Map<String, String> fieldErrors) {
    ErrorResponse response = new ErrorResponse(
            Instant.now(), status.value(), error, message, fieldErrors
    );
    return ResponseEntity.status(status).body(response);
  }
}