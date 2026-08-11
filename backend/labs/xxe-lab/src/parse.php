<?php
header('Content-Type: text/plain');

$xmlInput = file_get_contents('php://input');

if (empty($xmlInput)) {
    http_response_code(400);
    echo "Error: No XML data provided";
    exit;
}

libxml_use_internal_errors(true);
libxml_disable_entity_loader(false);

$doc = new DOMDocument();
$doc->preserveWhiteSpace = false;

if (!$doc->loadXML($xmlInput, LIBXML_NOENT | LIBXML_DTDLOAD | LIBXML_NOCDATA)) {
    echo "XML Parsing Errors:\n";
    foreach (libxml_get_errors() as $error) {
        echo "- " . trim($error->message) . "\n";
    }
    libxml_clear_errors();
    exit;
}

$output = "";

$xpath = new DOMXPath($doc);
$elements = $xpath->query('//*');

foreach ($elements as $element) {
    if ($element->textContent && $element->nodeName !== '#document') {
        $output .= $element->nodeName . ": " . $element->textContent . "\n";
    }
}

if (empty($output)) {
    $output = "XML parsed successfully but no text content found.\n";
    $output .= "Document structure:\n" . $doc->saveXML();
}

echo $output;
?>
