import xml.etree.ElementTree as ET
from django.http import HttpResponse
from django.views import View
from products.models import Product, Category

class RobotsTxtView(View):
    def get(self, request):
        domain = request.build_absolute_uri('/')
        lines = [
            "User-agent: *",
            "Disallow: /admin/",
            "Disallow: /api/",
            f"Sitemap: {domain}sitemap.xml"
        ]
        return HttpResponse("\n".join(lines), content_type="text/plain")

class SitemapXmlView(View):
    def get(self, request):
        domain = request.build_absolute_uri('/')
        urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

        # Root URL
        url = ET.SubElement(urlset, "url")
        ET.SubElement(url, "loc").text = domain
        ET.SubElement(url, "changefreq").text = "daily"
        ET.SubElement(url, "priority").text = "1.0"

        # Dynamic Category URLs
        for cat in Category.objects.filter(status='active'):
            url_node = ET.SubElement(urlset, "url")
            ET.SubElement(url_node, "loc").text = f"{domain}categories/{cat.slug}"
            ET.SubElement(url_node, "changefreq").text = "weekly"
            ET.SubElement(url_node, "priority").text = "0.8"

        # Dynamic Product URLs
        for prod in Product.objects.filter(is_active=True):
            url_node = ET.SubElement(urlset, "url")
            ET.SubElement(url_node, "loc").text = f"{domain}products/{prod.slug}"
            ET.SubElement(url_node, "changefreq").text = "daily"
            ET.SubElement(url_node, "priority").text = "0.9"

        xml_bytes = ET.tostring(urlset, encoding='utf-8', method='xml')
        xml_declaration = b'<?xml version="1.0" encoding="UTF-8"?>\n'
        return HttpResponse(xml_declaration + xml_bytes, content_type="application/xml")
