#### **Extension Functional Testing - v1.3.0**
**Test Basic Block Functionality**
1. Access `https://reddit.com`.
	- [ ] Verify that it blocks `https://reddit.com`.
**Test Failing and Resetting the Challenge**
2. Open the popup menu for the extension.
3. Click "Disable for 5 min".
	- [ ] Verify that a challenge with a random AZaz09 challenge presents
4. Fail the challenge.
	- [ ] Verify that the challenge fails and does now disable the blocking feature
5. Close the popup.
6. Open the popup.
	- [ ] Verify that the "Disable for 5 min" button is still useable.
**Test the Challenge and Disable Block Function**
7. Click "Disable for 5 min".
8. Complete the AZaz09 challenge.
9. Try to access `https://reddit.com` again.
	- [ ] Verify you should be able to now access the website
	- [ ] Verify the button becomes the countdown timer in the format "Re-enabling in m:ss"
**Manually Re-Enabling Function**
10. Click "Re-enabling in m:ss"
11. Try to access `https://reddit.com` again.
	- [ ] Verify that it blocks `https://reddit.com`.
	- [ ] Verify the button goes back to "Disable for 5 min".
**Re-Enabling Function: Pop-Up Closed**
12. Click "Disable for 5 min".
13. Complete the AZaz09 challenge.
14. Close the popup window.
15. Wait the 5 minutes that the display countdown shows.
	- [ ] Verify that it blocks `https://reddit.com`.
	- [ ] Verify the button goes back to "Disable for 5 min".
**Re-Enabling Function: Pop-Up Open**
16. Click "Disable for 5 min".
17. Complete the AZaz09 challenge.
18. Leave the popup window open.
	- Alternatively, wait 4 minutes and 30 seconds then wait 30 seconds.
19. Wait the 5 minutes that the display countdown shows.
	- [ ] Verify that it blocks `https://reddit.com`.
	- [ ] Verify the button goes back to "Disable for 5 min".

###### Test Records
**2025-06-21 - v1.3.0**
1. Access `https://reddit.com`.
	- [x] Verify that it blocks `https://reddit.com`.
2. Open the popup menu for the extension.
3. Click "Disable for 5 min".
	- [x] Verify that a challenge with a random AZaz09 challenge presents
4. Fail the challenge.
	- [x] Verify that the challenge fails and does now disable the blocking feature
5. Close the popup.
6. Open the popup.
	- [x] Verify that the "Disable for 5 min" button is still useable.
7. Click "Disable for 5 min".
8. Complete the AZaz09 challenge.
9. Try to access `https://reddit.com` again.
	- [x] Verify you should be able to now access the website.
10. Click "Re-enabling in m:ss"
11. Try to access `https://reddit.com` again.
	- [x] Verify that it blocks `https://reddit.com`.
12. Click "Disable for 5 min".
13. Complete the AZaz09 challenge.
14. Wait the 5 minutes that the display countdown shows.
	- [x] Verify that it blocks `https://reddit.com`.

**Verdict:** `PASS`
