# Requirements Document

## Introduction

The Panic Button Emergency Alert System is a critical safety feature for Smart City infrastructure that enables businesses (banks, jewelry stores, and other high-risk establishments) to instantly alert law enforcement during emergency situations such as robberies, theft, or threats. The system consists of physical panic buttons connected to ESP32 devices, a Spring Boot backend for alert processing and storage, and a real-time dashboard for police monitoring and response coordination.

## Glossary

- **Panic_Button**: Physical button device installed at business premises that triggers emergency alerts when pressed
- **ESP32_Device**: Microcontroller hardware that detects panic button presses and transmits alerts to the backend via HTTP
- **Alert_API**: Backend REST endpoint that receives emergency alerts from ESP32 devices
- **Emergency_Alert**: Data entity representing an emergency incident with status tracking and audit trail
- **Alert_Status**: Current state of an emergency alert (PENDING, IN_PROGRESS, RESOLVED)
- **Police_Dashboard**: Web interface used by law enforcement to monitor and respond to emergency alerts
- **WebSocket_Service**: Real-time communication service that pushes alerts to connected police dashboards
- **Device_Token**: Authentication credential assigned to each ESP32 device for API access
- **Location**: Physical address and coordinates of the business premises where the panic button is installed
- **Audit_Trail**: Complete history of status changes and actions taken on an emergency alert
- **Rate_Limiter**: Security mechanism that prevents excessive alert submissions from a single device

## Requirements

### Requirement 1: Panic Button Detection

**User Story:** As a business employee, I want to trigger an emergency alert by pressing the panic button, so that law enforcement is immediately notified of a dangerous situation.

#### Acceptance Criteria

1. WHEN the Panic_Button is pressed, THE ESP32_Device SHALL detect the button press within 100 milliseconds
2. WHEN the button press is detected, THE ESP32_Device SHALL send an HTTP POST request to the Alert_API within 500 milliseconds
3. THE HTTP request SHALL include device_id, location_id, alert_type, and timestamp fields
4. IF the HTTP request fails, THEN THE ESP32_Device SHALL retry up to 3 times with exponential backoff (1s, 2s, 4s)
5. WHEN all retry attempts fail, THE ESP32_Device SHALL log the failure locally for later synchronization

### Requirement 2: Device Authentication

**User Story:** As a system administrator, I want ESP32 devices to authenticate with the backend, so that only authorized devices can trigger emergency alerts.

#### Acceptance Criteria

1. THE Alert_API SHALL require a valid Device_Token in the Authorization header for all alert submissions
2. WHEN an alert request contains an invalid or missing Device_Token, THE Alert_API SHALL reject the request with HTTP 401 status
3. WHEN an alert request contains a valid Device_Token, THE Alert_API SHALL verify the device is registered and active
4. IF a Device_Token is revoked or expired, THEN THE Alert_API SHALL reject the request with HTTP 403 status
5. THE Alert_API SHALL log all authentication failures with device_id, timestamp, and IP address

### Requirement 3: Alert Creation and Storage

**User Story:** As a system operator, I want emergency alerts to be immediately stored in the database, so that no alert data is lost even if downstream systems fail.

#### Acceptance Criteria

1. WHEN the Alert_API receives a valid alert request, THE Alert_API SHALL create an Emergency_Alert entity within 200 milliseconds
2. THE Emergency_Alert SHALL include id, device_id, location_id, alert_type, status (PENDING), created_at, and metadata fields
3. THE Alert_API SHALL persist the Emergency_Alert to the PostgreSQL database before sending any response
4. WHEN database persistence succeeds, THE Alert_API SHALL return HTTP 201 status with the created alert_id
5. IF database persistence fails, THEN THE Alert_API SHALL return HTTP 500 status and log the error with full request details
6. THE Alert_API SHALL ensure each alert creation is atomic and transactional

### Requirement 4: Rate Limiting

**User Story:** As a security administrator, I want to prevent alert spam from malfunctioning or compromised devices, so that the system remains reliable and responsive.

#### Acceptance Criteria

1. THE Rate_Limiter SHALL allow a maximum of 5 alert submissions per device_id within a 60-second window
2. WHEN a device exceeds the rate limit, THE Rate_Limiter SHALL reject the request with HTTP 429 status
3. THE Rate_Limiter SHALL include Retry-After header indicating when the device can submit again
4. THE Rate_Limiter SHALL log all rate limit violations with device_id, timestamp, and violation count
5. WHERE a device has 10 or more rate limit violations within 24 hours, THE Rate_Limiter SHALL automatically suspend the device and notify administrators

### Requirement 5: Real-Time Alert Broadcasting

**User Story:** As a police officer, I want to receive emergency alerts instantly on my dashboard, so that I can respond to incidents without delay.

#### Acceptance Criteria

1. WHEN an Emergency_Alert is created, THE WebSocket_Service SHALL broadcast the alert to all connected Police_Dashboard clients within 500 milliseconds
2. THE broadcast message SHALL include alert_id, device_id, location (address and coordinates), alert_type, status, and created_at
3. THE WebSocket_Service SHALL use the "/topic/emergency-alerts" destination for broadcasting
4. IF a Police_Dashboard client is disconnected, THEN THE WebSocket_Service SHALL queue alerts for delivery upon reconnection (up to 100 alerts per client)
5. THE WebSocket_Service SHALL log all broadcast operations with alert_id, recipient count, and delivery timestamp

### Requirement 6: Alert Status Management

**User Story:** As a police officer, I want to update the status of emergency alerts, so that my team knows which incidents are being handled and which are resolved.

#### Acceptance Criteria

1. THE Police_Dashboard SHALL allow officers to update Alert_Status from PENDING to IN_PROGRESS
2. THE Police_Dashboard SHALL allow officers to update Alert_Status from IN_PROGRESS to RESOLVED
3. WHEN an officer updates Alert_Status, THE Police_Dashboard SHALL send the update to the Alert_API with alert_id, new_status, officer_id, and notes
4. THE Alert_API SHALL validate the status transition (PENDING → IN_PROGRESS → RESOLVED only)
5. IF an invalid status transition is attempted, THEN THE Alert_API SHALL reject the request with HTTP 400 status and error message
6. WHEN a valid status update is received, THE Alert_API SHALL update the Emergency_Alert and broadcast the change via WebSocket_Service

### Requirement 7: Alert Resolution Tracking

**User Story:** As a police supervisor, I want to track who resolved each emergency alert and when, so that I can review response times and officer performance.

#### Acceptance Criteria

1. WHEN Alert_Status is updated to RESOLVED, THE Alert_API SHALL record resolved_at timestamp
2. WHEN Alert_Status is updated to RESOLVED, THE Alert_API SHALL record resolved_by with the officer_id
3. THE Alert_API SHALL require notes field when transitioning to RESOLVED status
4. IF notes field is empty when resolving, THEN THE Alert_API SHALL reject the request with HTTP 400 status
5. THE Emergency_Alert SHALL preserve the complete Audit_Trail of all status changes with timestamps and officer_ids

### Requirement 8: Audit Trail Logging

**User Story:** As a system auditor, I want a complete history of all actions taken on emergency alerts, so that I can investigate incidents and ensure accountability.

#### Acceptance Criteria

1. WHEN an Emergency_Alert is created, THE Alert_API SHALL create an audit log entry with action "CREATED", timestamp, and device_id
2. WHEN Alert_Status is updated, THE Alert_API SHALL create an audit log entry with action "STATUS_CHANGED", old_status, new_status, officer_id, and timestamp
3. WHEN notes are added to an alert, THE Alert_API SHALL create an audit log entry with action "NOTES_ADDED", officer_id, and timestamp
4. THE Audit_Trail SHALL be immutable and append-only
5. THE Alert_API SHALL store audit log entries in a separate audit_logs table with foreign key to Emergency_Alert
6. THE Alert_API SHALL ensure audit log creation is part of the same database transaction as the alert operation

### Requirement 9: Location Information Management

**User Story:** As a police dispatcher, I want to see the exact location of each emergency alert, so that I can dispatch officers to the correct address.

#### Acceptance Criteria

1. THE Emergency_Alert SHALL include location_id referencing a Location entity
2. THE Location entity SHALL include business_name, street_address, city, postal_code, latitude, and longitude fields
3. WHEN the Police_Dashboard displays an alert, THE Police_Dashboard SHALL show the complete address and coordinates
4. THE Police_Dashboard SHALL provide a map view showing the alert location with a marker
5. THE Police_Dashboard SHALL calculate and display the distance from the nearest police station to the alert location

### Requirement 10: Alert Query and Filtering

**User Story:** As a police officer, I want to filter and search emergency alerts by status, date, and location, so that I can focus on relevant incidents.

#### Acceptance Criteria

1. THE Alert_API SHALL provide a GET endpoint that returns Emergency_Alert records with pagination
2. THE Alert_API SHALL support filtering by Alert_Status (PENDING, IN_PROGRESS, RESOLVED)
3. THE Alert_API SHALL support filtering by date range (created_at between start_date and end_date)
4. THE Alert_API SHALL support filtering by location_id
5. THE Alert_API SHALL return results sorted by created_at in descending order (newest first)
6. THE Alert_API SHALL include pagination metadata (total_count, page_number, page_size) in the response

### Requirement 11: Dashboard Connection Management

**User Story:** As a police officer, I want my dashboard to automatically reconnect if the connection is lost, so that I don't miss emergency alerts.

#### Acceptance Criteria

1. WHEN a Police_Dashboard WebSocket connection is established, THE WebSocket_Service SHALL register the client and send a connection confirmation
2. WHEN a Police_Dashboard WebSocket connection is lost, THE Police_Dashboard SHALL attempt to reconnect with exponential backoff (1s, 2s, 4s, 8s, 16s, max 30s)
3. WHEN a Police_Dashboard reconnects, THE WebSocket_Service SHALL deliver any queued alerts that were missed during disconnection
4. THE Police_Dashboard SHALL display a connection status indicator (connected, disconnected, reconnecting)
5. IF reconnection fails after 10 attempts, THEN THE Police_Dashboard SHALL display an error message and prompt the officer to refresh the page

### Requirement 12: Alert Notification Sound

**User Story:** As a police officer, I want to hear an audible alert when a new emergency is received, so that I notice critical alerts even when not actively watching the screen.

#### Acceptance Criteria

1. WHEN a new Emergency_Alert is received via WebSocket, THE Police_Dashboard SHALL play an audible notification sound
2. THE notification sound SHALL be distinct and attention-grabbing (minimum 80 decibels equivalent)
3. THE Police_Dashboard SHALL continue playing the sound every 5 seconds until the officer acknowledges the alert
4. THE Police_Dashboard SHALL provide a user setting to enable/disable notification sounds
5. WHERE notification sounds are disabled, THE Police_Dashboard SHALL still display a visual notification (flashing banner or popup)

### Requirement 13: Device Registration and Management

**User Story:** As a system administrator, I want to register and manage ESP32 devices, so that I can control which devices are authorized to send alerts.

#### Acceptance Criteria

1. THE Alert_API SHALL provide an endpoint to register new ESP32_Device records with device_id, location_id, and device_name
2. WHEN a device is registered, THE Alert_API SHALL generate a unique Device_Token and return it in the response
3. THE Alert_API SHALL provide an endpoint to list all registered devices with their status (active, suspended, revoked)
4. THE Alert_API SHALL provide an endpoint to suspend a device by device_id
5. WHEN a device is suspended, THE Alert_API SHALL revoke its Device_Token and reject future alert submissions
6. THE Alert_API SHALL provide an endpoint to reactivate a suspended device with a new Device_Token

### Requirement 14: Alert Statistics and Reporting

**User Story:** As a police supervisor, I want to view statistics on emergency alerts, so that I can analyze response patterns and identify high-risk locations.

#### Acceptance Criteria

1. THE Alert_API SHALL provide an endpoint that returns alert statistics for a specified date range
2. THE statistics SHALL include total_alerts, alerts_by_status (PENDING, IN_PROGRESS, RESOLVED), and alerts_by_location
3. THE statistics SHALL include average_response_time (time from PENDING to IN_PROGRESS) and average_resolution_time (time from PENDING to RESOLVED)
4. THE Alert_API SHALL calculate response times only for alerts that have been resolved
5. THE Alert_API SHALL return statistics grouped by day, week, or month based on a query parameter

### Requirement 15: System Health Monitoring

**User Story:** As a system administrator, I want to monitor the health of the emergency alert system, so that I can detect and fix issues before they impact emergency response.

#### Acceptance Criteria

1. THE Alert_API SHALL provide a health check endpoint that returns system status
2. THE health check SHALL verify database connectivity and return "healthy" or "unhealthy" status
3. THE health check SHALL verify WebSocket_Service connectivity and return connection count
4. THE health check SHALL include metrics for total_alerts_today, pending_alerts_count, and average_api_response_time
5. IF any component is unhealthy, THEN THE health check SHALL return HTTP 503 status with details of the failing component
6. THE Alert_API SHALL expose health metrics in Prometheus format for monitoring integration

### Requirement 16: Data Retention and Archival

**User Story:** As a compliance officer, I want emergency alert data to be retained according to legal requirements, so that historical records are available for investigations and audits.

#### Acceptance Criteria

1. THE Alert_API SHALL retain all Emergency_Alert records and Audit_Trail entries for a minimum of 7 years
2. WHEN an Emergency_Alert is older than 2 years, THE Alert_API SHALL archive it to a separate archive table
3. THE archived alerts SHALL remain queryable through the same Alert_API endpoints
4. THE Alert_API SHALL provide an endpoint to export alert data in JSON or CSV format for a specified date range
5. THE export SHALL include all Emergency_Alert fields, Audit_Trail entries, and related Location information

### Requirement 17: Multi-Tenancy Support

**User Story:** As a system architect, I want the system to support multiple police departments, so that each department only sees alerts within their jurisdiction.

#### Acceptance Criteria

1. THE Location entity SHALL include a jurisdiction_id field referencing a police department
2. WHEN a Police_Dashboard connects via WebSocket, THE WebSocket_Service SHALL authenticate the officer and determine their jurisdiction_id
3. THE WebSocket_Service SHALL only broadcast Emergency_Alert records where the Location jurisdiction_id matches the officer's jurisdiction_id
4. THE Alert_API query endpoints SHALL filter results by jurisdiction_id based on the authenticated officer's jurisdiction
5. WHERE an officer has multi-jurisdiction access, THE Alert_API SHALL return alerts from all authorized jurisdictions

### Requirement 18: Alert Priority Levels

**User Story:** As a police dispatcher, I want to see the priority level of each emergency alert, so that I can allocate resources appropriately.

#### Acceptance Criteria

1. THE Emergency_Alert SHALL include a priority field with values LOW, MEDIUM, HIGH, CRITICAL
2. WHEN an ESP32_Device submits an alert, THE Alert_API SHALL determine priority based on alert_type and location risk profile
3. WHERE a Location has a high_risk flag set to true, THE Alert_API SHALL automatically set priority to HIGH or CRITICAL
4. THE Police_Dashboard SHALL sort alerts by priority (CRITICAL first) and then by created_at
5. THE Police_Dashboard SHALL use distinct visual indicators for each priority level (colors, icons, or badges)

### Requirement 19: False Alarm Handling

**User Story:** As a police officer, I want to mark alerts as false alarms, so that we can track accidental activations and improve system accuracy.

#### Acceptance Criteria

1. THE Alert_API SHALL support a special status value FALSE_ALARM in addition to PENDING, IN_PROGRESS, RESOLVED
2. THE Police_Dashboard SHALL allow officers to mark an alert as FALSE_ALARM from any status
3. WHEN an alert is marked as FALSE_ALARM, THE Alert_API SHALL require a reason field (accidental_press, test, malfunction, other)
4. THE Alert_API SHALL track false alarm rate per device_id and per location_id
5. WHERE a device has more than 30% false alarm rate over 30 days, THE Alert_API SHALL flag the device for maintenance review

### Requirement 20: Integration with Existing Notification Module

**User Story:** As a system architect, I want to leverage the existing notification module, so that we can send SMS or email alerts to officers who are not actively monitoring the dashboard.

#### Acceptance Criteria

1. WHEN an Emergency_Alert with priority CRITICAL is created, THE Alert_API SHALL invoke the existing Notification_Service
2. THE Notification_Service SHALL send SMS notifications to all on-duty officers in the relevant jurisdiction
3. THE Notification_Service SHALL send email notifications to supervisors and dispatchers
4. THE notification message SHALL include alert_id, location address, alert_type, and priority
5. THE Alert_API SHALL log all notification attempts with delivery status (sent, failed, pending)
