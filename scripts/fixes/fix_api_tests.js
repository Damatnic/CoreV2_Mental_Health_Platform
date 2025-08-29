const fs = require('fs');

// Read the file
let content = fs.readFileSync('src/utils/ApiClient.test.ts', 'utf8');

// Fix the patterns where we expect only one parameter
const patterns = [
  {
    old: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/assessments/history/user123'
      );`,
    new: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/assessments/history/user123',
        expect.any(Object)
      );`
  },
  {
    old: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/habits/predefined'
      );`,
    new: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/habits/predefined',
        expect.any(Object)
      );`
  },
  {
    old: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/mood/history/user123'
      );`,
    new: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/mood/history/user123',
        expect.any(Object)
      );`
  },
  {
    old: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/videos'
      );`,
    new: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/wellness/videos',
        expect.any(Object)
      );`
  },
  {
    old: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/users/safety-plan/user123'
      );`,
    new: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/users/safety-plan/user123',
        expect.any(Object)
      );`
  },
  {
    old: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/users/consent/user123/privacy-policy'
      );`,
    new: `      expect(mockFetch).toHaveBeenCalledWith(
        '/.netlify/functions/users/consent/user123/privacy-policy',
        expect.any(Object)
      );`
  }
];

// Apply replacements
patterns.forEach(pattern => {
  content = content.replace(pattern.old, pattern.new);
});

// Write back
fs.writeFileSync('src/utils/ApiClient.test.ts', content);
console.log('Fixed API test expectations');
