<?xml version="1.0"?>
<!--

A very dirty and likely brittle script to extract common terms from the OWL files found in the Semantic Analysis Tool. 

for more information, please review the README.md file in this directory.

-->

<xsl:stylesheet version="1.0"
		xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
		xmlns:protege="http://protege.stanford.edu/plugins/owl/protege#"
		xmlns:xsp="http://www.owl-ontologies.com/2005/08/07/xsp.owl#"
		xmlns:owl="http://www.w3.org/2002/07/owl#"
		xmlns:xsd="http://www.w3.org/2001/XMLSchema#"
		xmlns:swrl="http://www.w3.org/2003/11/swrl#"
		xmlns:swrlb="http://www.w3.org/2003/11/swrlb#"
		xmlns:rdfs="http://www.w3.org/2000/01/rdf-schema#"
		xml:base="http://www.cloud4all.eu/SemanticFrameworkForContentAndSolutions.owl"
		xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:variable name="lower" select="'abcdefghijklmnopqrstuvwxyz'" />
  <xsl:variable name="upper" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'" />

  <xsl:output method="text"/>

  <xsl:template match="/">
    <xsl:text>{&#10;  &quot;docs&quot;: [&#10;</xsl:text>
    <xsl:apply-templates select=".//Registry"/>
    <xsl:text>  ]&#10;}&#10;</xsl:text>
  </xsl:template>

  <xsl:template match="Registry">
    <xsl:apply-templates select="RegistryTerm_uses"/>

    <xsl:variable name="dequalifiedName" select="substring-after(@rdf:ID,'Reg_')"/>
    <xsl:text>    {&#10;</xsl:text>
    <xsl:text>      &quot;satId&quot;: &quot;</xsl:text>
    <xsl:value-of select="@rdf:ID"/>
    <xsl:text>&quot;,&#10;</xsl:text>
    <xsl:text>      &quot;uniqueId&quot;: &quot;gpii:</xsl:text>
    <xsl:value-of select="concat(translate(substring($dequalifiedName,1,1),$upper,$lower),'',substring($dequalifiedName,2))"/>
    <xsl:text>&quot;,&#10;</xsl:text>

    <xsl:text>      &quot;hasId&quot;: &quot;</xsl:text>
    <xsl:value-of select="RegistryTerm_hasID"/>
    <xsl:text>&quot;,&#10;</xsl:text>

    <xsl:text>      &quot;type&quot;: &quot;GENERAL&quot;,&#10;</xsl:text>

    <xsl:if test="string-length(RegistryTerm_hasValueSpace) &gt; 0">
      <xsl:text>      &quot;valueSpace&quot;: &quot;</xsl:text>
      <xsl:call-template name="escape-text"><xsl:with-param name="value" select="RegistryTerm_hasValueSpace"/></xsl:call-template>
      <xsl:text>&quot;,&#10;</xsl:text>
    </xsl:if>

    <xsl:if test="string-length(RegistryTerm_hasName) &gt; 0">
      <xsl:text>      &quot;labelText&quot;: &quot;</xsl:text>
      <xsl:call-template name="escape-text"><xsl:with-param name="value" select="RegistryTerm_hasName"/></xsl:call-template>
      <xsl:text>&quot;,&#10;</xsl:text>
    </xsl:if>

    <xsl:if test="string-length(RegistryTerm_hasType) &gt; 0">
      <xsl:text>      &quot;hasType&quot;: &quot;</xsl:text>
      <xsl:call-template name="escape-text"><xsl:with-param name="value" select="RegistryTerm_hasType"/></xsl:call-template>
      <xsl:text>&quot;,&#10;</xsl:text>
    </xsl:if>

    <xsl:text>      &quot;definition&quot;: &quot;</xsl:text>
    <xsl:call-template name="escape-text"><xsl:with-param name="value" select="RegistryTerm_hasDescription"/></xsl:call-template>
    <xsl:text>&quot;&#10;</xsl:text>

    <xsl:text>    }</xsl:text>
    <xsl:if test="not(position() = last())"><xsl:text>,</xsl:text></xsl:if>
    <xsl:text>&#10;</xsl:text>
  </xsl:template>

  <xsl:template match="RegistryTerm_uses">
    <xsl:if test="count(./*[starts-with(name(),'TermsUsedByRegistry_')]) &gt; 0">
      <xsl:text>    {</xsl:text>
      <xsl:apply-templates select="./*[starts-with(name(),'TermsUsedByRegistry_')]"/>
      <xsl:text>    },&#10;</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template match="*[starts-with(name(),'TermsUsedByRegistry_')]">
    <xsl:variable name="namespace" select="substring-after(name(),'TermsUsedByRegistry_')"/>
    <xsl:variable name="lcNamespace" select="translate($namespace, $upper, $lower)"/>

    <xsl:text>&#10;</xsl:text>

    <xsl:text>      &quot;uniqueId&quot;: &quot;</xsl:text>
    <xsl:value-of select="$lcNamespace"/>
    <xsl:text>:</xsl:text>
    <xsl:variable name="rawId" select="substring-after(substring-after(@rdf:ID,$namespace),'_')"/>
    <xsl:choose>
      <xsl:when test="string-length($rawId) &gt; 1">
	<xsl:value-of select="concat(translate(substring($rawId,1,1),$upper,$lower),'',substring($rawId,2))"/>
      </xsl:when>
      <xsl:otherwise>
	<xsl:text>@@NO ID</xsl:text>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:text>&quot;,&#10;</xsl:text>
    <xsl:text>      &quot;aliasOf&quot;: &quot;gpii:</xsl:text>
    <xsl:variable name="parentIdMinusNamespace" select="substring-after(../../@rdf:ID,'Reg_')"/>
    <xsl:value-of select="concat(translate(substring($parentIdMinusNamespace,1,1),$upper,$lower),'',substring($parentIdMinusNamespace,2))"/>
    <xsl:text>&quot;,&#10;</xsl:text>
    <xsl:if test="string-length(TermUsedByRegistry_UserPreference) &gt; 0">
      <xsl:text>      &quot;termLabel&quot;: &quot;</xsl:text>
      <xsl:call-template name="escape-text"><xsl:with-param name="value" select="TermUsedByRegistry_UserPreference"/></xsl:call-template>
      <xsl:text>&quot;,&#10;</xsl:text>
    </xsl:if>
    <xsl:text>      &quot;type&quot;: &quot;ALIAS&quot;&#10;</xsl:text>
  </xsl:template>

  <xsl:template match="*">
    <xsl:text>Don't know how to handle this element:</xsl:text>
    <xsl:value-of select="name(.)"/>
    <xsl:text>&#10;</xsl:text>
  </xsl:template>

  <xsl:template name="escape-text">
    <xsl:param name="value"/>

    <xsl:choose>
      <xsl:when test="contains($value,'&quot;')">
	<xsl:variable name="newvalue">
	  <xsl:value-of select="concat(substring-before($value,'&quot;'),'&amp;quot;',substring-after($value,'&quot;'))"/>
	</xsl:variable>

	<xsl:call-template name="escape-text"><xsl:with-param name="value" select="$newvalue"/></xsl:call-template>
      </xsl:when>
      <xsl:when test="contains($value,&quot;&apos;&quot;)">
	<xsl:variable name="newvalue">
	  <xsl:value-of select="concat(substring-before($value,&quot;&apos;&quot;),'&amp;apos;',substring-after($value,&quot;&apos;&quot;))"/>
	</xsl:variable>

	<xsl:call-template name="escape-text"><xsl:with-param name="value" select="$newvalue"/></xsl:call-template>
      </xsl:when>
      <xsl:otherwise>
	<xsl:value-of select="$value"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>

