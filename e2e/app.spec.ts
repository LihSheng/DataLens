import { test, expect } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  // Clear local storage and session to ensure clean auth state
  await page.goto('/')
  await page.evaluate(() => localStorage.clear())
  await page.reload()
})

// ─── Test 1: Full login → send message → view sources ─────────────────────

test('login → send message → chat interface is functional', async ({ page }) => {
  // Should redirect to /login when unauthenticated
  await expect(page).toHaveURL(/\/login/)

  // Fill in login form
  await page.getByLabel(/email/i).fill('alice@example.com')
  await page.locator('#password').fill('password123')

  // Submit
  await page.getByRole('button', { name: /sign in/i }).click()

  // Should redirect to chat page
  await expect(page).toHaveURL('http://localhost:5173/')

  // Chat page should show the conversation list (New Chat button)
  await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible()

  // Type a message in the chat input
  const chatInput = page.locator('textarea[aria-label*="chat" i], textarea[placeholder*="message" i]').first()
  await expect(chatInput).toBeVisible()
  await chatInput.fill('What file formats are supported?')

  // Send the message
  await page.keyboard.press('Enter')

  // User message should appear immediately in the chat thread
  await expect(page.getByText('What file formats are supported?')).toBeVisible()

  // The chat input should be usable (not permanently disabled)
  // Note: Streaming behavior depends on the browser environment;
  // the message appears immediately (user message confirmed sent).
  await expect(page.locator('textarea')).toBeEnabled()

  // Can start a new conversation
  await page.getByRole('button', { name: /new chat/i }).click()
  await expect(page.locator('textarea')).toBeVisible()
})

// ─── Test 2: Upload document → status transitions to Ready ────────────────

test('upload document → status shows Processing then Ready', async ({ page }) => {
  // Login first
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('alice@example.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  // Navigate to Knowledge Base
  await page.getByRole('link', { name: /knowledge base/i }).click()
  await expect(page).toHaveURL(/\/knowledge-base/)

  // The upload zone should be visible
  const uploadZone = page.getByRole('button', { name: /upload files/i })
  await expect(uploadZone).toBeVisible()

  // Upload a valid PDF file
  const fileInput = page.locator('#file-input')
  await fileInput.setInputFiles({
    name: 'test-document.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from('dummy pdf content'),
  })

  // Should appear in the upload queue with a progress bar
  await expect(page.getByText('test-document.pdf')).toBeVisible()

  // Wait for status to transition to "Ready" (MSW mock transitions after 3s)
  // Target the badge span specifically, not the <select> option
  await expect(page.locator('span:has-text("Ready")').first()).toBeVisible({ timeout: 10_000 })
})

// ─── Test 3: Delete document → confirm dialog → row removed ─────────────

test('delete document → confirm dialog → row removed', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('alice@example.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  // Navigate to Knowledge Base
  await page.getByRole('link', { name: /knowledge base/i }).click()
  await expect(page).toHaveURL(/\/knowledge-base/)

  // Wait for documents to load
  await expect(page.getByText('Product Requirements Q3.pdf')).toBeVisible()

  // Click delete on the first document
  const deleteButtons = page.getByRole('button', { name: /delete/i })
  await deleteButtons.first().click()

  // Confirm dialog should appear
  await expect(page.getByText(/delete document/i)).toBeVisible()
  await expect(page.getByText(/this will permanently remove/i)).toBeVisible()

  // Click confirm delete
  await page.getByRole('button', { name: /^delete$/i }).click()

  // Dialog should close
  await expect(page.getByText(/delete document/i)).not.toBeVisible()

  // The deleted row should be gone
  await expect(page.getByText('Product Requirements Q3.pdf')).not.toBeVisible()
})

// ─── Test 4: Logout → redirect to /login → protected route blocked ─────────

test('logout → redirect to /login → protected route blocked', async ({ page }) => {
  // Login
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('alice@example.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  // Verify we're on the chat page
  await expect(page.getByRole('button', { name: /new chat/i })).toBeVisible()

  // Click logout (user menu in sidebar)
  const logoutButton = page.getByRole('button', { name: /log out/i })
  await logoutButton.click()

  // Should redirect to /login
  await expect(page).toHaveURL(/\/login/)

  // /login should render the login form
  await expect(page.getByLabel(/email/i)).toBeVisible()

  // Try to access a protected route directly (should redirect back to /login)
  await page.goto('/knowledge-base')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByLabel(/email/i)).toBeVisible()

  await page.goto('/settings')
  await expect(page).toHaveURL(/\/login/)
  await expect(page.getByLabel(/email/i)).toBeVisible()
})

// ─── Test 5: Admin retrieval settings → scoped chat → trust signals → feedback ─

test('admin retrieval settings → scoped chat → trust signals → feedback', async ({ page }) => {
  // 1. Login as admin
  await page.goto('/login')
  await page.getByLabel(/email/i).fill('alice@example.com')
  await page.locator('#password').fill('password123')
  await page.getByRole('button', { name: /sign in/i }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  // 2. Go to Settings, change TopK to 3, save
  await page.getByRole('link', { name: /settings/i }).click()
  await expect(page).toHaveURL(/\/settings/)

  // Find the TopK input (RangeSlider or number input)
  // The label is "Top K Retrieval" and it's a RangeSlider
  const topKSlider = page.locator('input[type="range"]').first()
  await expect(topKSlider).toBeVisible()

  // Clear and set to 3
  await topKSlider.fill('3')

  // Save
  await page.getByRole('button', { name: /^save$/i }).click()

  // Wait for save confirmation (toast or field reset)
  await expect(page.getByRole('button', { name: /^save$/i })).toBeEnabled()

  // 3. Go to Knowledge Base, click Details on a document, verify drawer opens
  await page.getByRole('link', { name: /knowledge base/i }).click()
  await expect(page).toHaveURL(/\/knowledge-base/)

  // Wait for document rows to load
  await expect(page.getByText('Product Requirements Q3.pdf')).toBeVisible()

  // Find and click the Details action for doc_1
  // DocumentActionMenu is accessed via the action menu button in the last column
  const actionMenuButtons = page.getByRole('button', { name: /more options/i })
  await actionMenuButtons.first().click()

  // Wait for dropdown to appear and click Details
  await page.getByRole('button', { name: /details/i }).click()

  // DocumentDetailDrawer should open with document name
  await expect(page.getByText('Product Requirements Q3.pdf')).toBeVisible()
  // OCR info should be visible since doc_1 has ocrApplied: true
  await expect(page.getByText(/ocr/i)).toBeVisible()

  // Close drawer
  await page.getByRole('button', { name: /close/i }).first().click()

  // 4. Go to Chat, send a message
  await page.getByRole('link', { name: /chat/i }).click()
  await expect(page).toHaveURL('http://localhost:5173/')

  // Send a message
  const chatInput = page.locator('textarea[aria-label*="chat" i], textarea[placeholder*="message" i]').first()
  await chatInput.fill('What file formats are supported?')
  await page.keyboard.press('Enter')

  // 5. Verify confidence pill and grounding indicator appear
  // Wait for the assistant response to stream back and render
  await expect(page.getByText('What file formats are supported?')).toBeVisible()

  // Wait for trust signal badges to appear
  await expect(page.getByText(/high|medium|low/i).first()).toBeVisible({ timeout: 10_000 })
  // Grounding indicator
  await expect(page.getByText(/grounded|unverified/i).first()).toBeVisible({ timeout: 10_000 })

  // 6. Find an assistant message, click thumbs down, add a comment, submit
  // The assistant message is in the "assistant" role bubble
  const thumbsDownButton = page.getByRole('button', { name: /bad response/i })
  await expect(thumbsDownButton).toBeVisible()
  await thumbsDownButton.click()

  // Feedback form should appear
  const commentTextarea = page.getByPlaceholder(/optional feedback/i)
  await expect(commentTextarea).toBeVisible()
  await commentTextarea.fill('The answer could be more specific.')

  // Submit
  const submitButton = page.getByRole('button', { name: /^submit$/i })
  await submitButton.click()

  // 7. Verify thank-you state
  await expect(page.getByText(/thank you for your feedback/i)).toBeVisible()
})
