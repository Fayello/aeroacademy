<?php
header('Content-Type: text/plain');

if (!isset($_FILES['file'])) {
    http_response_code(400);
    echo "Error: No file uploaded";
    exit;
}

$file = $_FILES['file'];
$content = file_get_contents($file['tmp_name']);

if (empty($content)) {
    echo "Error: File is empty";
    exit;
}

libxml_use_internal_errors(true);
libxml_disable_entity_loader(false);

$doc = new DOMDocument();
$doc->preserveWhiteSpace = false;

if (!$doc->loadXML($content, LIBXML_NOENT | LIBXML_DTDLOAD | LIBXML_NOCDATA)) {
    echo "XML Parsing Errors:\n";
    foreach (libxml_get_errors() as $error) {
        echo "- " . trim($error->message) . "\n";
    }
    libxml_clear_errors();
    exit;
}

$xpath = new DOMXPath($doc);
$elements = $xpath->query('//*');

$output = "";
foreach ($elements as $element) {
    if ($element->textContent && $element->nodeName !== '#document') {
        $output .= $element->nodeName . ": " . $element->textContent . "\n";
    }
}

echo $output ?: "File parsed successfully (no extractable content)";
?>
