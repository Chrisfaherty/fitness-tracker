# Barcode Scanner Testing Guide

## Overview
This guide provides comprehensive instructions for testing the barcode scanning functionality in the Fitness Tracker app.

## Prerequisites

### 1. HTTPS Requirement
- **Critical**: Camera access requires HTTPS
- Local development: Use `https://localhost:5173` or `https://127.0.0.1:5173`
- Production: Ensure SSL certificate is properly configured
- Test URLs that will work:
  - `https://localhost:5173`
  - `https://127.0.0.1:5173`
  - Any deployed HTTPS site

### 2. Supported Browsers
- **Chrome**: 87+ (Recommended)
- **Firefox**: 85+
- **Safari**: 14+
- **Edge**: 87+
- **Mobile browsers**: Chrome Mobile, Safari Mobile

### 3. Device Requirements
- Camera-enabled device (smartphone, tablet, laptop with webcam)
- Stable internet connection for Open Food Facts API
- Good lighting conditions for scanning

## Testing Steps

### Step 1: Run the Application
```bash
# Install dependencies
npm install

# Start development server with HTTPS
npm run dev -- --https

# Or manually access with HTTPS
# Visit: https://localhost:5173
```

### Step 2: Initial Camera Test
1. Navigate to `/camera-test` in your browser
2. Review the test results:
   - ✅ Browser Support
   - ✅ HTTPS Security
   - ✅ Camera Permission
   - ✅ Available Cameras

### Step 3: Permission Testing
Test different permission scenarios:

#### Scenario A: First-time Access
1. Open app in incognito/private mode
2. Navigate to Nutrition → Scan Barcode
3. Should prompt for camera permission
4. Click "Allow" and verify camera starts

#### Scenario B: Permission Denied
1. Deny camera permission when prompted
2. Verify error message appears with helpful instructions
3. Check that manual entry fallback is offered

#### Scenario C: HTTPS Issues
1. Try accessing via HTTP (should fail)
2. Verify clear error message about HTTPS requirement

### Step 4: Barcode Scanning Tests

#### Test Products (Known Working Barcodes)
Use these real product barcodes for testing:

1. **Coca-Cola** (EAN-13): `5000112637304`
2. **Nutella** (EAN-13): `3017620422003`
3. **Kellogg's Corn Flakes** (EAN-13): `5053827142350`
4. **Bananas** (UPC-A): `4011200296906`

#### Test Scenarios

**Scenario 1: Successful Scan**
1. Open barcode scanner
2. Point camera at a valid food product barcode
3. Wait for detection (3 consecutive reads required)
4. Verify:
   - Scanner stops automatically
   - Product information appears
   - Food is added to selected meal

**Scenario 2: Unknown Product**
1. Scan a barcode not in Open Food Facts database
2. Verify:
   - "Product not found" message appears
   - Option to add manually is provided
   - Scan history is recorded

**Scenario 3: Invalid Barcode**
1. Point camera at QR code or text
2. Verify scanner continues running (doesn't stop for invalid codes)

**Scenario 4: Network Issues**
1. Disconnect internet
2. Scan a valid barcode
3. Verify:
   - Graceful offline handling
   - Fallback to cached data if available
   - Clear error message if no cache

### Step 5: Mobile-Specific Tests

#### iOS Safari
- Test camera permission flow
- Verify back camera is preferred
- Test landscape/portrait orientation
- Check safe area handling

#### Android Chrome
- Test different camera selection
- Verify auto-focus works
- Test with different lighting conditions

### Step 6: Error Handling Tests

#### Camera Errors
1. **Camera in use**: Open another app using camera, then try scanner
2. **No camera**: Test on device without camera
3. **Camera blocked**: Block camera in browser settings

#### Network Errors
1. **Slow connection**: Test with throttled network
2. **API failure**: Simulate API timeouts
3. **Invalid response**: Test with malformed API responses

### Step 7: Performance Tests

#### Scan Speed
- Time from barcode detection to product display
- Should be under 3 seconds for good connection

#### Memory Usage
- Monitor memory during extended scanning sessions
- Check for memory leaks

#### Battery Impact
- Test battery drain during continuous scanning
- Verify camera is properly released when not scanning

## Expected Behaviors

### Successful Flow
1. User taps "Scan Barcode"
2. Camera permission requested (if needed)
3. Camera view opens with scanning overlay
4. Barcode detected after 3 consecutive reads
5. Camera stops, processing indicator shows
6. Product information retrieved
7. Food added to meal, scanner closes

### Error Recovery
1. Permission denied → Show help message with retry option
2. No camera → Graceful fallback to manual entry
3. Scan failure → Clear error message with retry
4. Network issue → Offline mode with cached data

## Performance Benchmarks

### Scan Detection
- **Target**: 3-5 seconds for barcode detection
- **Acceptable**: Under 10 seconds
- **Failure**: Over 15 seconds or no detection

### API Response
- **Target**: Under 2 seconds for product lookup
- **Acceptable**: Under 5 seconds
- **Failure**: Over 10 seconds or timeout

### Camera Startup
- **Target**: Under 2 seconds to show camera view
- **Acceptable**: Under 5 seconds
- **Failure**: Over 10 seconds or failure to start

## Troubleshooting Common Issues

### Camera Won't Start
1. Check HTTPS requirement
2. Verify browser permissions
3. Close other apps using camera
4. Try different browser
5. Check browser console for errors

### Barcode Not Detected
1. Ensure good lighting
2. Hold steady, don't move too fast
3. Try different angles
4. Clean camera lens
5. Test with known working barcode

### Product Not Found
1. Verify barcode is for food product
2. Check Open Food Facts database manually
3. Try scanning a different product
4. Use manual entry as fallback

### Performance Issues
1. Close other browser tabs
2. Check available memory
3. Restart browser
4. Clear browser cache
5. Update browser to latest version

## Integration Testing

### Nutrition Flow
1. Start from Nutrition page
2. Select meal type (breakfast, lunch, etc.)
3. Scan barcode
4. Verify food appears in correct meal section
5. Check nutrition totals update

### Offline Capability
1. Scan products while online (builds cache)
2. Disconnect internet
3. Scan previously scanned products
4. Verify offline data is used

### Data Persistence
1. Scan and add foods
2. Close browser/app
3. Reopen and verify data persists
4. Check IndexedDB storage

## Browser Console Debugging

Enable browser developer tools and monitor:

### Console Messages
- Scanner initialization logs
- Permission request results
- Barcode detection events
- API request/response logs
- Error messages with stack traces

### Network Tab
- Open Food Facts API calls
- Response times and status codes
- Failed requests and retries

### Application Tab
- IndexedDB entries for cached products
- LocalStorage for user preferences
- Service worker status (if applicable)

## Automated Testing Commands

```bash
# Run development server
npm run dev

# Access test page
curl -k https://localhost:5173/camera-test

# Check for console errors (manual browser check required)
```

## Test Results Documentation

Document test results in this format:

```
## Test Session: [Date]
**Device**: [Device info]
**Browser**: [Browser version]
**Connection**: [Network type]

### Results
- Browser Support: ✅/❌
- HTTPS Check: ✅/❌
- Camera Permission: ✅/❌
- Barcode Detection: ✅/❌
- Product Lookup: ✅/❌
- Error Handling: ✅/❌

### Performance
- Camera startup: [X] seconds
- Barcode detection: [X] seconds
- API response: [X] seconds

### Issues Found
- [List any issues]

### Notes
- [Additional observations]
```

## Next Steps

After successful testing:
1. Deploy to staging environment with HTTPS
2. Test on various mobile devices
3. Gather user feedback
4. Monitor error rates in production
5. Optimize based on real usage patterns