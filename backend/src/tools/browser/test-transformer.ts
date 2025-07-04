import { config } from 'dotenv';
import { dirname, join } from 'path';
import { transformHtml } from './transform-html';
import { readFileSync } from 'fs';

const backendDir = join(dirname(__filename), '..', '..', '..');
const envPath = join(backendDir, '.env');
config({ path: envPath });

async function main() {
    const testDir = dirname(__filename);
    const inputFile = join(testDir, 'dr-test-html-input.html');

    const html = readFileSync(inputFile, 'utf-8');
    const { summarizedHtml, formElements, links } = await transformHtml(html);

    // console.log(summarizedHtml);
    // console.log(formElements);
    // console.log(links);
}

(async () => {
    await main();
})();


//     // Define input and output file paths
//     const inputFile = join(testDir, 'test-html-input.html');
//     const outputFile = join(testDir, 'test-html-output.json');


// import 'dotenv/config';
// import { readFileSync, writeFileSync } from 'fs';
// import { join, dirname } from 'path';
// import { transformHtmlContent } from './html-transformer';
// import { logger } from '../../utils/logger';
// import { transformHtml } from './transform-html';

// /**
//  * Test file for HTML transformer
//  * Reads HTML from a file and transforms it using the HtmlTransformer
//  */

// async function testHtmlTransformer() {
//   try {
//     // Get the directory of this test file
//     const testDir = dirname(__filename);
    
//     // Define input and output file paths
//     const inputFile = join(testDir, 'test-html-input.html');
//     const outputFile = join(testDir, 'test-html-output.json');
    
//     console.log('🔍 Looking for HTML input file:', inputFile);
    
//     // Check if input file exists
//     try {
//       const htmlContent = readFileSync(inputFile, 'utf-8');
//       console.log(`✅ Found HTML file: ${inputFile} (${htmlContent.length} characters)`);
      
//       console.log('🔄 Starting HTML transformation...');
//       const startTime = Date.now();
      
//       // Transform the HTML content
//       const transformedContent = await transformHtml(htmlContent, 'https://www.dr.dk/');
      
//       const endTime = Date.now();
//       console.log(`✅ Transformation completed in ${endTime - startTime}ms`);
//       console.log(`📊 Input: ${htmlContent.length} characters → Output: ${transformedContent.length} characters`);
      
//       // Write the transformed content to output file
//       writeFileSync(outputFile, transformedContent, 'utf-8');
//       console.log(`💾 Transformed content saved to: ${outputFile}`);
      
//       // Display a preview of the transformed content
//       console.log('\n📄 Preview of transformed content:');
//       console.log('=' .repeat(50));
      
//       // Try to parse as JSON and pretty print it
//       try {
//         // Check if content is wrapped in markdown code blocks
//         let jsonContent = transformedContent;
//         if (transformedContent.startsWith('```json') && transformedContent.endsWith('```')) {
//           // Extract JSON content from markdown code blocks
//           jsonContent = transformedContent.slice(7, -3).trim(); // Remove ```json and ```
//         } else if (transformedContent.startsWith('```') && transformedContent.endsWith('```')) {
//           // Extract content from generic code blocks
//           jsonContent = transformedContent.slice(3, -3).trim(); // Remove ``` and ```
//         }
        
//         const parsedContent = JSON.parse(jsonContent);
//         // console.log(JSON.stringify(parsedContent, null, 2));
//         writeFileSync(outputFile, JSON.stringify(parsedContent, null, 2), 'utf-8');
//       } catch (parseError) {
//         // If it's not valid JSON, display as regular text
//         console.log(parseError);
//       }
      
//       console.log('=' .repeat(50));
      
//     } catch (fileError: unknown) {
//       const errorMessage = fileError instanceof Error ? fileError.message : String(fileError);
//       console.error('❌ Error reading input file:', errorMessage);
//       console.log('\n📝 Creating sample HTML file for testing...');
      
//       // Create a sample HTML file for testing
//       const sampleHtml = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Sample Test Page</title>
//     <style>
//         body { font-family: Arial, sans-serif; margin: 20px; }
//         .header { background: #f0f0f0; padding: 10px; }
//         .content { margin: 20px 0; }
//         .footer { background: #e0e0e0; padding: 10px; text-align: center; }
//     </style>
// </head>
// <body>
//     <header class="header">
//         <h1>Welcome to Our Website</h1>
//         <nav>
//             <a href="/home">Home</a> |
//             <a href="/about">About</a> |
//             <a href="/contact">Contact</a>
//         </nav>
//     </header>
    
//     <main class="content">
//         <section>
//             <h2>About Our Company</h2>
//             <p>We are a leading technology company specializing in innovative solutions for modern businesses. Our team of experts works tirelessly to deliver cutting-edge products that help organizations thrive in the digital age.</p>
            
//             <h3>Our Services</h3>
//             <ul>
//                 <li>Web Development</li>
//                 <li>Mobile Applications</li>
//                 <li>Cloud Solutions</li>
//                 <li>Data Analytics</li>
//             </ul>
//         </section>
        
//         <section>
//             <h2>Latest News</h2>
//             <article>
//                 <h3>New Product Launch</h3>
//                 <p>We're excited to announce the launch of our latest product, designed to revolutionize how businesses handle their data.</p>
//                 <a href="/news/product-launch">Read more</a>
//             </article>
            
//             <article>
//                 <h3>Industry Recognition</h3>
//                 <p>Our company has been recognized as one of the top 100 technology companies in the region.</p>
//                 <a href="/news/recognition">Read more</a>
//             </article>
//         </section>
//     </main>
    
//     <aside>
//         <h3>Quick Links</h3>
//         <ul>
//             <li><a href="/services">Our Services</a></li>
//             <li><a href="/portfolio">Portfolio</a></li>
//             <li><a href="/blog">Blog</a></li>
//             <li><a href="/careers">Careers</a></li>
//         </ul>
//     </aside>
    
//     <footer class="footer">
//         <p>&copy; 2024 Our Company. All rights reserved.</p>
//         <p><a href="/privacy">Privacy Policy</a> | <a href="/terms">Terms of Service</a></p>
//     </footer>
    
//     <script>
//         console.log('This is a test script');
//     </script>
// </body>
// </html>`;
      
//       writeFileSync(inputFile, sampleHtml, 'utf-8');
//       console.log(`✅ Created sample HTML file: ${inputFile}`);
//       console.log('🔄 Now running the test with the sample file...');
      
//       // Run the transformation with the sample file
//       const transformedContent = await transformHtmlContent(sampleHtml);
      
//       // Write the transformed content to output file
//       writeFileSync(outputFile, transformedContent, 'utf-8');
//       console.log(`💾 Transformed content saved to: ${outputFile}`);
      
//       // Display a preview
//       console.log('\n📄 Preview of transformed content:');
//       console.log('=' .repeat(50));
      
//       // Try to parse as JSON and pretty print it
//       try {
//         // Check if content is wrapped in markdown code blocks
//         let jsonContent = transformedContent;
//         if (transformedContent.startsWith('```json') && transformedContent.endsWith('```')) {
//           // Extract JSON content from markdown code blocks
//           jsonContent = transformedContent.slice(7, -3).trim(); // Remove ```json and ```
//         } else if (transformedContent.startsWith('```') && transformedContent.endsWith('```')) {
//           // Extract content from generic code blocks
//           jsonContent = transformedContent.slice(3, -3).trim(); // Remove ``` and ```
//         }
        
//         const parsedContent = JSON.parse(jsonContent);
//         console.log(JSON.stringify(parsedContent, null, 2));
//       } catch (parseError) {
//         // If it's not valid JSON, display as regular text (truncated)
//         console.log(transformedContent.substring(0, 500) + (transformedContent.length > 500 ? '...' : ''));
//       }
      
//       console.log('=' .repeat(50));
//     }
    
//   } catch (error) {
//     console.error('❌ Test failed:', error);
//     logger.error('HTML transformer test failed:', error);
//   }
// }

// // Run the test if this file is executed directly
// if (require.main === module) {
//   console.log('🚀 Starting HTML Transformer Test...\n');
//   testHtmlTransformer()
//     .then(() => {
//       console.log('\n✅ Test completed successfully!');
//       process.exit(0);
//     })
//     .catch((error) => {
//       console.error('\n❌ Test failed:', error);
//       process.exit(1);
//     });
// }

// export { testHtmlTransformer }; 